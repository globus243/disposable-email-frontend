import {
    Button,
    ButtonGroup,
    Grid,
    IconButton,
    Popover,
    TextField,
    Tooltip
} from "@mui/material";
import { timeTo } from "../../utils/helper";
import { Timer } from "@mui/icons-material";
import dayjs, { Dayjs } from 'dayjs';
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import 'dayjs/locale/en-gb';
import React, { useState } from "react";
import LoadingButton from "@mui/lab/LoadingButton";

type ExtendTtlProps = {
    ttl: number;
    onTtlSave: ( ttl: number ) => Promise<void>;
}

type TtlPopoverSettings = {
    anchorEl: HTMLElement | null;
    show: boolean;
}

function ExtendTtl( props: ExtendTtlProps ) {
    const [ newTtl, setNewTtl ] = useState<Dayjs>();
    const [ isLoading, setIsLoading ] = useState<boolean>( false );
    const [ ttlPopoverSettings, setTtlPopoverSettings ] = React.useState<TtlPopoverSettings>( {
        anchorEl: null,
        show: false
    } );

    const extendTtl = ( seconds: number ) => {
        if ( newTtl ) {
            setNewTtl( newTtl.add( seconds, 'second' ) );
        } else {
            setNewTtl( dayjs.unix( props.ttl ).add( seconds, 'second' ) );
        }
    }

    const changeTtl = () => {
        setIsLoading( true );
        props.onTtlSave( newTtl!.valueOf() / 1000 )
            .then( () => {
                setTtlPopoverSettings( { anchorEl: null, show: false } );
            } )
            .finally( () => {
                setIsLoading( false );
            } );
    }

    const expireAddress = () => {
        setIsLoading( true );
        props.onTtlSave( 0 )
            .then( () => {
                setTtlPopoverSettings( { anchorEl: null, show: false } );
            } )
            .finally( () => {
                setIsLoading( false );
            } );
    }

    return (
        <>
            <Tooltip title={ `Email will expire ${ timeTo( props.ttl ) }` }>
                <IconButton color="inherit"
                            onClick={ ( event ) => {
                                setNewTtl( dayjs.unix( props.ttl ) );
                                setTtlPopoverSettings( {
                                    anchorEl: event.currentTarget,
                                    show: true
                                } )
                            } }>
                    <Timer/>
                </IconButton>
            </Tooltip>
            <Popover
                open={ ttlPopoverSettings.show }
                anchorEl={ ttlPopoverSettings.anchorEl }
                onClose={ () => {
                    setNewTtl( undefined );
                    setTtlPopoverSettings( {
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
                      justifyContent="center"
                >
                    <LocalizationProvider dateAdapter={ AdapterDayjs }
                                          adapterLocale={ "en-gb" }>
                        <DateTimePicker
                            renderInput={ ( props ) =>
                                <TextField { ...props } /> }
                            label="Email TTL"
                            value={ newTtl || dayjs.unix( props.ttl ) }
                            onChange={ ( newDate: Dayjs | null ) => {
                                if ( newDate ) {
                                    setNewTtl( newDate );
                                }
                            } }
                        />
                    </LocalizationProvider>
                    <ButtonGroup variant="text" aria-label="text button group"
                                 fullWidth={ true }>
                        <Button
                            onClick={ () => extendTtl( 86400 ) }
                        >+1 Day</Button>
                        <Button
                            onClick={ () => extendTtl( 604800 ) }
                        >+1 Week</Button>
                        <Button
                            onClick={ () => extendTtl( 31536000 ) }
                        >+1 Year</Button>
                    </ButtonGroup>
                    <Grid container
                          direction="row"
                          justifyContent="space-between"
                    >
                        <LoadingButton
                            sx={ { marginTop: "1rem" } }
                            color={ "error" }
                            size="large"
                            loading={ isLoading }
                            disabled={ isLoading }
                            onClick={ () => {
                                expireAddress();
                            } }
                            loadingPosition="end"
                            variant="contained">
                            Delete
                        </LoadingButton>
                        <LoadingButton
                            sx={ { marginTop: "1rem" } }
                            size="large"
                            loading={ isLoading }
                            disabled={ isLoading }
                            onClick={ () => {
                                if ( newTtl ) {
                                    changeTtl();
                                }
                            } }
                            loadingPosition="end"
                            variant="contained">
                            Save
                        </LoadingButton>
                    </Grid>
                </Grid>
            </Popover>
        </>
    );
}

export default ExtendTtl;