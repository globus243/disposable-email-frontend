import {
    FormControlLabel,
    Grid,
    IconButton,
    Popover, Switch, TextField,
    Tooltip
} from "@mui/material";
import ForwardToInboxIcon from '@mui/icons-material/ForwardToInbox';
import 'dayjs/locale/en-gb';
import React, { useState } from "react";
import LoadingButton from "@mui/lab/LoadingButton";

type SetSettingsProps = {
    redirectEmail: string;
    redirect: boolean;
    onSettingsSave: ( redirectEmail: string, redirect: boolean ) => Promise<void>;
}

type PopoverSettings = {
    anchorEl: HTMLElement | null;
    show: boolean;
}

function SetRedirect( props: SetSettingsProps ) {
    const [ isLoading, setIsLoading ] = useState<boolean>( false );
    const [ redirectEmail, setRedirectEmail ] = useState<string>( props.redirectEmail );
    const [ redirect, setRedirect ] = useState<boolean>( props.redirect );
    const [ PopoverSettings, setPopoverSettings ] = React.useState<PopoverSettings>( {
        anchorEl: null,
        show: false
    } );

    const getTooltipTitle = () => {
        if ( props.redirect ) {
            return "Redirect to " + props.redirectEmail;
        } else {
            return "Redirect disabled";
        }
    }

    return (
        <>
            <Tooltip title={ getTooltipTitle() }>
                <IconButton color="inherit"
                            onClick={ ( event ) => {
                                setRedirectEmail( props.redirectEmail )
                                setRedirect( props.redirect )
                                setPopoverSettings( {
                                    anchorEl: event.currentTarget,
                                    show: true
                                } )
                            } }>
                    <ForwardToInboxIcon/>
                </IconButton>
            </Tooltip>
            <Popover
                open={ PopoverSettings.show }
                anchorEl={ PopoverSettings.anchorEl }
                onClose={ () => {
                    setRedirect( props.redirect )
                    setRedirectEmail( props.redirectEmail )
                    setPopoverSettings( {
                        anchorEl: null,
                        show: false
                    } )
                } }
                anchorOrigin={ {
                    vertical: 'bottom',
                    horizontal: 'center',
                } }
                transformOrigin={ {
                    vertical: 'top',
                    horizontal: 'center',
                } }
            >
                <Grid padding={ 2 }
                      container
                      direction="column"
                      justifyContent="space-between"
                >

                    <Grid container
                          direction="row"
                          alignItems={ "center" }
                          justifyContent="space-between"
                    >
                        <FormControlLabel
                            sx={ { marginLeft: 0 } }
                            control={
                                <Switch
                                    checked={ redirect }
                                    onChange={ ( event ) => setRedirect( event.target.checked ) }
                                    inputProps={ { 'aria-label': 'controlled' } }
                                />
                            } labelPlacement="top" label="Enable"/>

                        <TextField
                            label="Redirect to:"
                            value={ redirectEmail }
                            onChange={ ( event ) => setRedirectEmail( event.target.value ) }
                        />

                    </Grid>
                    <LoadingButton
                        sx={ { marginTop: "1rem" } }
                        size="large"
                        loading={ isLoading }
                        disabled={ isLoading }
                        onClick={ () => {
                            setIsLoading( true );
                            props.onSettingsSave( redirectEmail, redirect )
                                .then( () => {
                                    setPopoverSettings( {
                                        anchorEl: null,
                                        show: false
                                    } );
                                } )
                                .finally( () => {
                                    setIsLoading( false );
                                } );
                        } }
                        loadingPosition="end"
                        variant="contained">
                        Save
                    </LoadingButton>
                </Grid>
            </Popover>
        </>
    );
}

export default SetRedirect;