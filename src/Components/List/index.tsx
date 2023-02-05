import { Helmet } from "react-helmet";
import React, { useEffect } from 'react';
import {
    AppBar,
    Card,
    CardContent,
    CircularProgress,
    Divider,
    Grid,
    IconButton,
    MenuItem,
    Select,
    Toolbar,
    Tooltip,
} from "@mui/material";
import {
    ExitToApp,
    FileCopy,
    Refresh,
    Send,
    Add
} from "@mui/icons-material";
import {
    DataGrid,
    GridColDef,
    GridColumnVisibilityModel
} from "@mui/x-data-grid";
import { Amplify } from "aws-amplify";
// @ts-ignore
import { NotificationContainer, NotificationManager } from 'react-notifications';
import { AddressObject, EmailObject } from "../../utils/types";
import EmailViewer from "../Viewer";
import EmailComposer from "../Composer";
import ExtendTtl from "../ExtendTtl";
import { defaultDataGridColumns } from "./DataGridDefinitions";
import SetRedirect from "../SetRedirect";

type EmailListProps = {
    address: string;
    addresses: AddressObject[];
    apiEndpoint: string;
    changeAddress: ( address: string, addresses: AddressObject[] ) => void;
}

function EmailList( props: EmailListProps ) {
    const [ address, setAddress ] = React.useState( props.address );
    const [ addresses, setAddresses ] = React.useState( props.addresses );
    const [ emails, setEmails ] = React.useState<EmailObject[]>( [] );
    const [ dataGridColumns, setDataGridColumns ] = React.useState<GridColDef[]>( defaultDataGridColumns );
    const [ isLoading, setIsLoading ] = React.useState( false );
    const [ selectedId, setSelectedId ] = React.useState( '' );
    const [ compose, setCompose ] = React.useState( false );
    const [ redirectSettings, setRedirectSettings ] = React.useState( {
        redirect: addresses.find( a => a.address === address )!.redirect,
        redirectAddress: addresses.find( a => a.address === address )!.redirect_email
    } );
    const [ ttl, setTtl ] = React.useState(
        addresses.filter( a => a.address === address )[ 0 ].ttl )

    useEffect( () => {
        getList( true )
    }, [] );

    useEffect( () => {
        setCompose( false );
    }, [ selectedId ] );

    useEffect( () => {
        setRedirectSettings( {
            redirect: addresses.find( a => a.address === address )!.redirect,
            redirectAddress: addresses.find( a => a.address === address )!.redirect_email
        } )
        setTtl( addresses.filter( a => a.address === address )[ 0 ].ttl )
    }, [ address ] );

    function listIsChanged( items: EmailObject[] ) {
        let new_ids = items.map( a => a.messageId );
        let old_ids = emails.map( a => a.messageId );
        return JSON.stringify( new_ids ) !== JSON.stringify( old_ids );
    }

    function gotNewMail( items: EmailObject[] ) {
        return items.some( a => a.isNew );
    }

    async function getList( force: boolean, tAddress = address ) {
        setIsLoading( true )
        const session = await Amplify.Auth.currentSession();
        const token = session.getIdToken().getJwtToken();

        fetch( props.apiEndpoint + tAddress,
            { headers: { Authorization: token } } )
            .then( response => {
                const statusCode = response.status;
                const data = response.json();
                return Promise.all( [ statusCode, data ] );
            } )
            .then( ( [ statusCode, data ] ) => {
                if ( statusCode === 400 ) {
                    logout();
                } else {
                    data.items.sort( function ( a: EmailObject, b: EmailObject ) {
                        if ( a.timestamp > b.timestamp ) {
                            return -1
                        } else {
                            return 1
                        }
                    } );
                    if ( gotNewMail( data.items ) ) {
                        NotificationManager.info( "New Email", "", 3000 );
                    }
                    if ( force || listIsChanged( data.items ) ) {
                        setEmails( data.items );
                        props.changeAddress( tAddress, addresses );
                        if ( ( selectedId === '' ) && ( data.items.length > 0 ) ) {
                            setSelectedId( data.items[ 0 ].messageId );
                        }
                        let longestFrom = data.items.reduce( function ( a: EmailObject, b: EmailObject ) {
                            return senderName( a.commonHeaders.from[ 0 ] ).length > senderName( b.commonHeaders.from[ 0 ] ).length ? a : b;
                        } );
                        let newColumns = dataGridColumns.map( a => {
                            if ( a.field === 'from' ) {
                                a.maxWidth = senderName( longestFrom.commonHeaders.from[ 0 ] ).length * 8;
                            }
                            return a;
                        } );
                        setDataGridColumns( newColumns );
                    }
                }
            } )
            .catch( console.error )
            .finally( () => setIsLoading( false ) );
    }

    async function setNewTTl( newTtl: number ) {
        return new Promise<void>( async ( resolve, reject ) => {
            const session = await Amplify.Auth.currentSession();
            const token = session.getIdToken().getJwtToken();
            const requestBody = {
                ttl: newTtl,
                action: "extend"
            }

            fetch( props.apiEndpoint + address,
                {
                    method: 'POST',
                    headers: {
                        Authorization: token,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify( requestBody )
                } )
                .then( response => {
                    const statusCode = response.status;
                    const data = response.json();
                    return Promise.all( [ statusCode, data ] );
                } )
                .then( ( [ , data ] ) => {
                    if ( data.result === "success" ) {
                        setTtl( data[ "new_ttl" ] );
                        setAddresses( addresses.map( a => {
                            if ( a.address === address ) {
                                a.ttl = data[ "new_ttl" ];
                            }
                            return a;
                        } ) );
                        props.changeAddress( address, addresses );
                        resolve();
                    }
                } )
                .catch( ( e ) => {
                    reject( e );
                    console.error( e )
                    throw e
                } )
        } );
    }


    function logout() {
        props.changeAddress( '', [] );
        localStorage.clear();
    }

    function senderName( address: string ) {
        const capitalize = ( sentence: string, lower: boolean ) => {
            let string = String( sentence )
            return ( lower ? string.toLowerCase() : string ).replace( /(?:^|\s)\S/g, function ( a ) {
                return a.toUpperCase();
            } );
        };

        const tokens = String( address ).split( '<' );
        if ( tokens[ 0 ] !== '' ) {
            return capitalize( tokens[ 0 ], false );
        } else {
            return address;
        }
    }

    async function changeAddressSettings( redirect: boolean, redirectAddress: string ) {
        return new Promise<void>( async ( resolve, reject ) => {
            const session = await Amplify.Auth.currentSession();
            const token = session.getIdToken().getJwtToken();
            const requestBody = {
                redirect: redirect,
                redirect_email: redirectAddress,
                action: "redirect"
            }

            fetch( props.apiEndpoint + address,
                {
                    method: 'POST',
                    headers: {
                        Authorization: token,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify( requestBody )
                } )
                .then( response => {
                    const statusCode = response.status;
                    const data = response.json();
                    return Promise.all( [ statusCode, data ] );
                } )
                .then( ( [ , data ] ) => {
                    if ( data.result === "success" ) {
                        setRedirectSettings( {
                            redirect: data.redirect,
                            redirectAddress: data.redirect_to
                        } );
                        setAddresses( addresses.map( a => {
                            if ( a.address === address ) {
                                a.redirect = redirect;
                                a.redirect_email = redirectAddress;
                            }
                            return a;
                        } ) );
                        props.changeAddress( address, addresses );
                        resolve();
                    } else {
                        reject( data );
                        throw new Error( data.message );
                    }
                } )
                .catch( console.error );
        } );
    }

    async function changeAddress( address: string ) {
        setSelectedId( '' );
        setCompose( false );
        if ( address === "add" ) {
            setIsLoading( true );
            const session = await Amplify.Auth.currentSession();
            const token = session.getIdToken().getJwtToken();
            const uri = props.apiEndpoint
                + 'create?address=random';
            fetch( encodeURI( uri ), {
                headers: { Authorization: token },
            } )
                .then( r => r.json().then( data => ( {
                    status: r.status,
                    body: data
                } ) ) )
                .then( r => {
                    if ( r.status === 200 ) {
                        getList( true, r.body.address );
                        setAddresses( r.body.allAddresses )
                        setAddress( r.body.address )
                        setSelectedId( '' );
                    }
                } )
                .catch( console.error )
            return;
        }
        setAddress( address );
        getList( true, address );
    }

    const newMails = emails.filter( email => email.isNew );
    let title = 'Disposable Email';
    if ( newMails.length > 0 ) {
        title = '(' + newMails.length + ') Disposable Email';
    }

    function getDataGridHeight() {
        let nrRows = emails.length === 0 ? 1 : emails.length;
        return ( nrRows * 40 + 102 ) / window.innerHeight * 100 > 90
            ? "90vh" : ( nrRows * 40 + 105 ) / window.innerHeight * 100 + "vh"
    }

    return (
        <>
            <Helmet>
                <title>{ title }</title>
            </Helmet>

            <AppBar position="static">
                <Toolbar>
                    <Grid
                        container
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                    >
                        <Grid item>
                            <Select
                                sx={ { color: "white" } }
                                value={ address as any }
                                label="Available Addresses"
                                onChange={ ( event ) => changeAddress( event.target.value as string ) }
                            >
                                { addresses.map( ( a ) => (
                                    <MenuItem value={ a.address }>{ a.address }</MenuItem>
                                ) ) }
                                <Divider/>
                                <MenuItem value={ "add" }>
                                    <Grid
                                        container
                                        direction="row"
                                        justifyContent="space-around"
                                        alignItems="center"
                                    >
                                        <Add/>
                                    </Grid>
                                </MenuItem>
                            </Select>
                            <Tooltip title="Copy to Clipboard">
                                <IconButton color="inherit"
                                            onClick={ () => navigator.clipboard.writeText( address ) }>
                                    <FileCopy/>
                                </IconButton>
                            </Tooltip>

                            <ExtendTtl
                                ttl={ ttl }
                                onTtlSave={ async ( ttl: number ) => {
                                    return await setNewTTl( ttl );
                                } }
                            />

                            <SetRedirect
                                redirectEmail={ redirectSettings.redirectAddress }
                                redirect={ redirectSettings.redirect }
                                onSettingsSave={ async ( e, r ) => {
                                    await changeAddressSettings( r, e );
                                    } }
                            />

                        </Grid>
                        <Grid item>
                            { compose ? null :
                                <Tooltip title="Send an Email">
                                    <IconButton color="inherit"
                                                onClick={ () => {
                                                    setCompose( true );
                                                } }>
                                        <Send/>
                                    </IconButton>
                                </Tooltip>
                            }

                            <Tooltip title="Refresh list">
                                <IconButton color="inherit"
                                            onClick={ () => getList( true ) }>
                                    <Refresh/>
                                </IconButton>
                            </Tooltip>

                            <Tooltip title="Logout">
                                <IconButton color="inherit" onClick={ () => logout() }>
                                    <ExitToApp/>
                                </IconButton>
                            </Tooltip>
                        </Grid>
                    </Grid>
                </Toolbar>
            </AppBar>

            <Grid container spacing={ 1 } padding={ 1 }>
                <Grid item xs={ 6 }>
                    <Card elevation={ 3 }>
                        { isLoading ?
                            <Card>
                                <CardContent>
                                    <Grid
                                        container
                                        width={ 1 }
                                        direction="column"
                                        alignItems="center"
                                        justifyContent="center"
                                    >
                                        <CircularProgress color="primary"/>
                                    </Grid>
                                </CardContent>
                            </Card>
                            :
                            <DataGrid
                                columns={ dataGridColumns }
                                rows={ emails.map( ( email, index ) => ( {
                                    id: email.messageId,
                                    isNew: email.isNew.toString(),
                                    count: index + 1,
                                    from: senderName( email.commonHeaders.from[ 0 ] ),
                                    subject: email.commonHeaders.subject,
                                    date: new Date( email.timestamp ).toLocaleString( "de-DE" ),
                                } ) ) as any }
                                pagination
                                hideFooterSelectedRowCount
                                rowHeight={ 40 }
                                headerHeight={ 50 }
                                localeText={ { noRowsLabel: "No Emails" } }
                                onColumnVisibilityModelChange={ ( model: GridColumnVisibilityModel ) => {
                                    setDataGridColumns( dataGridColumns.map( ( column ) => {
                                        column.hide = !model[ column.field ];
                                        return column;
                                    } ) );
                                } }
                                onRowClick={ ( params ) => {
                                    setSelectedId( params.row.id );
                                    setEmails( emails.map( ( e ) => {
                                        if ( e.messageId === params.row.id ) {
                                            e.isNew = false;
                                        }
                                        return e;
                                    } ) );
                                } }
                                sx={ {
                                    width: '100%',
                                    height: getDataGridHeight(),
                                    "&.MuiDataGrid-root .MuiDataGrid-cell:focus-within": {
                                        outline: "none !important",
                                    },
                                } }/>
                        }
                    </Card>
                </Grid>
                <Grid item xs={ 6 } maxHeight={ "100vh" }>
                    { compose ?
                        <EmailComposer
                            apiEndpoint={ props.apiEndpoint }
                            fromAddress={ address }/>
                        : <EmailViewer
                            address={ address }
                            messageId={ selectedId }
                            apiEndpoint={ props.apiEndpoint }
                        /> }
                </Grid>
            </Grid>
            <NotificationContainer/>
        </>

    )
}

export default EmailList;