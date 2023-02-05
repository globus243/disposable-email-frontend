import React from 'react';
import './App.css';
import { AppBar, Grid, Toolbar, Typography } from "@mui/material";

import Login from "./Components/Login";
import EmailList from "./Components/List";
import { AddressObject } from "./utils/types";


function App() {
    const [ address, setAddress ] = React.useState( '' );
    const [ addresses, setAddresses ] = React.useState<AddressObject[]>( [] );

    function changeAddress( newAddress: string, newAddresses: AddressObject[] ) {
        setAddress( newAddress );
        setAddresses( newAddresses );
    }

    if ( address !== '' ) {
        return (
            <EmailList
                address={ address }
                addresses={ addresses }
                changeAddress={ changeAddress }
                apiEndpoint={ process.env.REACT_APP_API_ENDPOINT! }/>
        );
    } else {
        return (
            <Grid>
                <AppBar position="static">
                    <Toolbar
                        sx={ { display: "flex", justifyContent: "center" } }>
                        <Typography
                            variant="h3"
                            component="div">
                            <b>Disposabl</b><i>e-mail</i>
                        </Typography>
                    </Toolbar>
                </AppBar>
                <Grid
                    container
                    justifyContent={ "center" }
                    paddingTop={ 5 }
                >
                    <Login
                        changeAddress={ changeAddress }
                        apiEndpoint={ process.env.REACT_APP_API_ENDPOINT! }
                        email_domain={ process.env.REACT_APP_MAIN_EMAIL_DOMAIN! }/>
                </Grid>
            </Grid>
        );
    }
}

export default  App ;
