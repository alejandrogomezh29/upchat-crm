import React, { useState, useEffect, useRef } from "react";

import { camelizeKeys } from "../actions/conversation";

import Paper from "@material-ui/core/Paper";
import Button from "@material-ui/core/Button";
import Typography from "@material-ui/core/Typography";
import Grid from "@material-ui/core/Grid";
import Link from "@material-ui/core/Link";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemAvatar from "@material-ui/core/ListItemAvatar";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemSecondaryAction from "@material-ui/core/ListItemSecondaryAction";
import ListItemText from "@material-ui/core/ListItemText";
import Avatar from "@material-ui/core/Avatar";
import IconButton from "@material-ui/core/IconButton";
import DeleteIcon from "@material-ui/icons/Delete";
import EditIcon from "@material-ui/icons/Edit";
import AddIcon from "@material-ui/icons/Add";
import Tab from "@material-ui/core/Tab";
import Tabs from "@material-ui/core/Tabs";
import Card from "@material-ui/core/Card";
import CardContent from "@material-ui/core/CardContent";

import Progress from "../shared/Progress";

import ContentHeader from "../components/ContentHeader";
import Content from "../components/Content";
import FormDialog from "../components/FormDialog";
import FieldRenderer from "../shared/FormFields";
import DeleteDialog from "../components/deleteDialog";

import { errorMessage, successMessage } from "../actions/status_messages";
import { setCurrentPage, setCurrentSection } from "../actions/navigation";

import graphql from "../graphql/client";
import { APP_PACKAGES, APP_PACKAGE_INTEGRATIONS } from "../graphql/queries";
import {
  CREATE_INTEGRATION,
  UPDATE_INTEGRATION,
  DELETE_INTEGRATION,
} from "../graphql/mutations";
import { withRouter } from "react-router-dom";
import { connect } from "react-redux";
import serialize from "form-serialize";
import styled from "@emotion/styled";

const BtnTabContainer = styled.div`
  background-color: #fff;

  button {
    margin-left: 0;
    min-width: 140px;
    min-height: unset;

    span {
      border-radius: 4px;
      padding: 10px;
      z-index: 1;
    }
  }

  button.Mui-selected {
    font-weight: 600;

    span {
      background-color: rgb(250, 247, 242);
    }
  }
`;

function Integrations({ app, dispatch }) {
  const [open, setOpen] = useState(false);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [integrations, setIntegrations] = useState([]);
  const [tabValue, setTabValue] = useState(0);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const form = useRef(null);

  useEffect(() => {
    dispatch(setCurrentSection("Settings"));
    dispatch(setCurrentPage("integrations"));
  }, []);

  function getAppPackages() {
    setLoading(true);
    graphql(
      APP_PACKAGES,
      {
        appKey: app.key,
      },
      {
        success: (data) => {
          setServices(data.app.appPackages);
          setLoading(false);
        },
        error: () => {
          setLoading(false);
        },
      }
    );
  }

  function getAppPackageIntegration() {
    setLoading(true);
    graphql(
      APP_PACKAGE_INTEGRATIONS,
      {
        appKey: app.key,
      },
      {
        success: (data) => {
          setIntegrations(data.app.appPackageIntegrations);
          setLoading(false);
        },
        error: () => {
          setLoading(false);
        },
      }
    );
  }

  function handleOpen(service) {
    setOpen(service);
  }

  function close() {
    setOpen(false);
  }

  function submit() {
    const serializedData = serialize(form.current, {
      hash: true,
      empty: true,
    });

    open.id
      ? updateIntegration(serializedData)
      : createIntegration(serializedData);
  }

  function createIntegration(serializedData) {
    graphql(
      CREATE_INTEGRATION,
      {
        appKey: app.key,
        appPackage: open.name,
        params: serializedData.app,
      },
      {
        success: (data) => {
          setTabValue(0);

          const integration = data.integrationsCreate.integration;
          const newIntegrations = integrations.map((o) =>
            o.name === integration.name ? integration : o
          );
          setIntegrations(newIntegrations);

          setOpen(null);
          dispatch(successMessage("integration created"));
        },
        error: () => {
          dispatch(errorMessage("error linking integration"));
        },
      }
    );
  }

  function updateIntegration(serializedData) {
    graphql(
      UPDATE_INTEGRATION,
      {
        appKey: app.key,
        appPackage: open.name,
        id: parseInt(open.id),
        params: serializedData.app,
      },
      {
        success: (data) => {
          setTabValue(0);
          const integration = data.integrationsUpdate.integration;
          const newIntegrations = integrations.map((o) =>
            o.name === integration.name ? integration : o
          );
          setIntegrations(newIntegrations);
          //getAppPackageIntegration()
          setOpen(null);
          dispatch(successMessage("integration updated"));
        },
        error: () => {
          dispatch(errorMessage("error updating integration"));
        },
      }
    );
  }

  function removeIntegration() {
    graphql(
      DELETE_INTEGRATION,
      {
        appKey: app.key,
        id: parseInt(openDeleteDialog.id),
      },
      {
        success: (data) => {
          setTabValue(0);
          const integration = data.integrationsDelete.integration;
          const newIntegrations = integrations.filter(
            (o) => o.name != integration.name
          );
          setIntegrations(newIntegrations);
          setOpen(null);
          setOpenDeleteDialog(null);
          dispatch(successMessage("integration removed correctly"));
        },
        error: () => {
          dispatch(errorMessage("error removing integration"));
        },
      }
    );
  }

  function handleTabChange(e, i) {
    setTabValue(i);
  }

  function tabsContent() {
    return (
      <BtnTabContainer>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          textColor="inherit"
          style={{
            marginLeft: "24px",
            marginRight: "24px",
            padding: "16px 0",
            borderTop: "solid 1px rgba(0,0,0,0.12)",
          }}
        >
          <Tab textColor="inherit" label="App Integrations" />
          <Tab textColor="inherit" label="API services" />
        </Tabs>
      </BtnTabContainer>
    );
  }

  function renderTabcontent() {
    switch (tabValue) {
      case 0:
        return (
          <React.Fragment>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                fontWeight: 600,
                padding: "20px 40px",
                borderBottom: "solid 1px rgba(0,0,0,.125)",
              }}
            >
              <span>API Integrations</span>
            </div>
            {loading && <Progress />}

            {integrations.length === 0 && !loading && (
              <EmptyCard
                goTo={() => {
                  setTabValue(1);
                }}
              />
            )}

            {
              <ServiceIntegration
                services={integrations}
                handleOpen={handleOpen}
                getAppPackages={getAppPackageIntegration}
                setOpenDeleteDialog={setOpenDeleteDialog}
                kind={"integrations"}
              />
            }
          </React.Fragment>
        );
      case 1:
        return (
          <React.Fragment>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                fontWeight: 600,
                padding: "20px 40px",
                borderBottom: "solid 1px rgba(0,0,0,.125)",
              }}
            >
              <span>Available API Services</span>
            </div>
            {loading && <Progress />}

            {
              <APIServices
                services={services}
                handleOpen={handleOpen}
                getAppPackages={getAppPackages}
                kind={"services"}
              />
            }
          </React.Fragment>
        );
    }
  }

  return (
    <React.Fragment>
      <ContentHeader
        title={"Third party integrations"}
        tabsContent={tabsContent()}
      />
      <div
        style={{
          margin: "0 50px 27px",
          backgroundColor: "#fff",
          borderRadius: "4px",
          border: "solid 1px rgba(0,0,0,.125)",
        }}
      >
        {renderTabcontent()}
      </div>

      {open && (
        <FormDialog
          open={open}
          titleContent={`${open.id ? "Update" : "Add"} ${
            open.name
          } integration`}
          formComponent={
            <form ref={form}>
              <Grid container spacing={3}>
                {open.definitions.map((field) => {
                  return (
                    <Grid
                      item
                      key={field.name}
                      xs={field.grid.xs}
                      sm={field.grid.sm}
                    >
                      <FieldRenderer
                        namespace={"app"}
                        data={camelizeKeys(field)}
                        props={{
                          data: open.settings
                            ? camelizeKeys(open.settings)
                            : {},
                        }}
                        errors={{}}
                      />
                    </Grid>
                  );
                })}
              </Grid>

              {open.id && (
                <Grid container direction={"column"}>
                  <Typography variant="overline">
                    This integration will receive webhook at:
                  </Typography>

                  <Typography variant={"caption"}>
                    {`${window.location.origin}/api/v1/hooks/${
                      app.key
                    }/${open.name.toLocaleLowerCase()}/${open.id}`}
                  </Typography>

                  <Typography variant="overline">Oauth callback:</Typography>

                  <Typography variant={"caption"}>
                    {`${window.location.origin}/api/v1/oauth/${
                      app.key
                    }/${open.name.toLocaleLowerCase()}/${open.id}`}
                  </Typography>
                </Grid>
              )}
            </form>
          }
          dialogButtons={
            <React.Fragment>
              <Button onClick={close} color="secondary">
                Cancel
              </Button>

              <Button onClick={submit} color="primary">
                {open ? "Update" : "Create"}
              </Button>
            </React.Fragment>
          }
        ></FormDialog>
      )}

      {openDeleteDialog && (
        <DeleteDialog
          open={openDeleteDialog}
          title={`Delete "${openDeleteDialog.name}" integration ?`}
          closeHandler={() => {
            this.setOpenDeleteDialog(null);
          }}
          deleteHandler={() => {
            removeIntegration(openDeleteDialog);
          }}
        >
          <Typography variant="subtitle2">
            The integration with {openDeleteDialog.dialog} service will be
            disabled immediately
          </Typography>
        </DeleteDialog>
      )}
    </React.Fragment>
  );
}

function EmptyCard({ goTo }) {
  return (
    <>
      <CardContent>
        <Typography color="textSecondary" gutterBottom></Typography>
        <Typography variant="h5" component="h2">
          You don't have any api integrations yet
        </Typography>
        <Typography color="textSecondary">
          search for available api services in{" "}
          <Link href="#" onClick={goTo}>
            API Services
          </Link>{" "}
          Tab
        </Typography>
      </CardContent>
    </>
  );
}

function ServiceBlock({ service, handleOpen, kind, setOpenDeleteDialog }) {
  function available() {
    if (kind === "services") return service.state === "enabled";
    if (kind === "integrations")
      return service.id && service.state === "enabled";
  }

  return (
    <>
      <ListItem>
        <ListItemAvatar>
          <Avatar style={{ borderRadius: "6px" }}>
            <img src={service.icon} height={20} width={20} />
          </Avatar>
        </ListItemAvatar>
        <ListItemText primary={service.name} secondary={service.description} />

        {available() && (
          <ListItemSecondaryAction>
            <IconButton
              onClick={() => handleOpen(service)}
              edge="end"
              aria-label="add"
            >
              {service.id ? <EditIcon /> : <AddIcon />}
            </IconButton>

            {service.id && (
              <IconButton
                onClick={() =>
                  setOpenDeleteDialog && setOpenDeleteDialog(service)
                }
                edge="end"
                aria-label="add"
              >
                <DeleteIcon />
              </IconButton>
            )}
          </ListItemSecondaryAction>
        )}
      </ListItem>
      <ListItem
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(255,255,255,1), rgba(255, 211, 0, 0), rgba(255, 211, 0, 1), rgba(255, 211, 0, 0), rgba(255,255,255,1))",
          width: "100%",
          height: "2px",
          padding: 0
        }}
      ></ListItem>
    </>
  );
}

function ServiceIntegration({
  services,
  handleOpen,
  getAppPackages,
  kind,
  setOpenDeleteDialog,
}) {
  useEffect(() => {
    getAppPackages();
  }, []);

  return (
    <List dense style={{backgroundColor: '#fff'}}>
      {services.map((o) => (
        <ServiceBlock
          kind={kind}
          key={`services-${o.name}`}
          service={o}
          setOpenDeleteDialog={setOpenDeleteDialog}
          handleOpen={handleOpen}
        />
      ))}
    </List>
  );
}

function APIServices({ services, handleOpen, getAppPackages, kind }) {
  useEffect(() => {
    getAppPackages();
  }, []);

  return (
    <List
      dense
      style={{
        backgroundColor: "#fff",
        maxWidth: "680px",
        margin: "auto",
        marginTop: "50px",
        marginBottom: "50px",
      }}
    >
      {services.map((o) => (
        <ServiceBlock
          kind={kind}
          key={`services-${o.name}`}
          service={o}
          handleOpen={handleOpen}
        />
      ))}
    </List>
  );
}

function mapStateToProps(state) {
  const { app } = state;

  return {
    app,
  };
}

export default withRouter(connect(mapStateToProps)(Integrations));
