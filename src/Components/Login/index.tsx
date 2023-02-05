import React from 'react';
import { Amplify, Auth } from 'aws-amplify';
import {
    FormControl,
    Grid,
    IconButton,
    InputAdornment,
    InputLabel, Link,
    OutlinedInput,
    Paper,
    Typography
} from "@mui/material";
// @ts-ignore
import LoadingButton from '@mui/lab/LoadingButton';
import { AddressObject } from "../../utils/types";
import { AccountCircle, Visibility, VisibilityOff } from "@mui/icons-material";

type LoginProps = {
    apiEndpoint: string;
    email_domain: string;
    changeAddress: ( address: string, addresses: AddressObject[] ) => void;
}

Amplify.configure( {
    Auth: {
        userPoolId: process.env.REACT_APP_USER_POOL_ID,
        region: process.env.REACT_APP_REGION,
        userPoolWebClientId: process.env.REACT_APP_USER_POOL_CLIENT_ID
    }
} );

function Login( props: LoginProps ) {
    const [ address, setAddress ] = React.useState( '' );
    const [ password, setPassword ] = React.useState( '' );
    const [ newPassword, setNewPassword ] = React.useState( '' );
    const [ username, setUsername ] = React.useState( '' );
    const [ showPassword, setShowPassword ] = React.useState( false );
    const [ isLoading, setIsLoading ] = React.useState( false );
    const [ newPassRequired, setNewPassRequired ] = React.useState( false );
    const [ emailToken, setEmailToken ] = React.useState( '' );
    const [ emailTokenRequired, setEmailTokenRequired ] = React.useState( false );

    async function login( username: string, password: string, newPassword: string | undefined ) {
        return new Promise<string>( async ( resolve, reject ) => {

            // in case of new password required and all values are set
            if ( newPassword && newPassword !== "" && emailToken !== "" ) {
                Auth.forgotPasswordSubmit( username, emailToken, newPassword )
                    .then( () => {
                        window.location.reload();
                    } )
                    .catch( e => {
                        console.error( e );
                        reject( e );
                    } );
            }

            Auth.signIn( username, password )
                .then( user => {
                    if ( user.challengeName === 'NEW_PASSWORD_REQUIRED' ) {
                        if ( !newPassword ) {
                            reject( 'New password required' );
                        } else {
                            Auth.completeNewPassword(
                                user,               // the Cognito User Object
                                newPassword       // the new password
                            ).then( ( user ) => {
                                resolve( user.signInUserSession.idToken.jwtToken );
                            } ).catch( e => {
                                console.error( e );
                            } );
                        }
                    } else {
                        resolve( user.signInUserSession.idToken.jwtToken );
                    }
                } )
                .catch( e => {
                    if ( e.code === 'PasswordResetRequiredException' ) {
                        if ( !newPassword || !emailTokenRequired ) {
                            setNewPassRequired( true );
                            setEmailTokenRequired( true );
                            reject( 'Password reset required' );
                        } else {
                            Auth.forgotPasswordSubmit( username, emailToken, newPassword )
                                .then( () => {
                                    window.location.reload();
                                } )
                                .catch( e => {
                                    console.error( e );
                                    reject( e );
                                } );
                        }
                    }
                } )
        } );
    }

    async function resetPassword() {
        return new Promise( async ( resolve, reject ) => {
            setNewPassRequired( true );
            setEmailTokenRequired( true );
            Auth.forgotPassword( username )
                .then( data => {
                    resolve( data );
                } )
                .catch( e => {
                    console.error( e );
                    reject( e );
                } );
        } );
    }

    async function handleSubmit( event: React.FormEvent<HTMLFormElement> ) {
        event.preventDefault();
        setIsLoading( true );

        let stop = false
        let jwtToken = '';
        try {
            jwtToken = await login( username, password, newPassRequired ? newPassword : undefined );
        } catch ( e ) {
            setIsLoading( false );
            setNewPassRequired( true );
            stop = true;
        }

        if ( stop ) return;

        const finalAddress = address === '' ? "random" : address + props.email_domain;
        const uri = props.apiEndpoint
            + 'create?address=' + finalAddress;
        fetch( encodeURI( uri ), {
            headers: { Authorization: jwtToken },
        } )
            .then( r => r.json().then( data => ( {
                status: r.status,
                body: data
            } ) ) )
            .then( r => {
                if ( r.status === 200 ) {
                    props.changeAddress(
                        r.body.address,
                        r.body.allAddresses );
                }
            } )
            .catch( console.error )
            .finally( () => setIsLoading( false ) );
    }

    return (
        <Paper elevation={ 3 }>

            <Typography
                padding={ 3 } variant="h4" component="h1" align="center">
                { newPassRequired ? "Please change your Password" : "Login" }
            </Typography>

            <form onSubmit={ handleSubmit }>
                <Grid
                    padding={ 5 }
                    container
                    direction="column"
                    alignItems="center"
                >
                    <Grid
                        container
                        direction="row"
                        justifyContent={ "space-around" }
                    >
                        { newPassRequired ? null :
                            <FormControl sx={ { width: "20rem" } } variant="outlined">
                                <InputLabel size={ "small" }
                                            htmlFor='username-input'>Username</InputLabel>
                                <OutlinedInput
                                    id={ 'username-input' }
                                    value={ username }
                                    size="small"
                                    label="Username"
                                    onChange={ ( e ) => setUsername( e.target.value ) }
                                    endAdornment={
                                        <InputAdornment position="end">
                                            <IconButton
                                                aria-label="toggle password visibility"
                                                edge="end"
                                                tabIndex={ -1 }
                                            >
                                                <AccountCircle/>
                                            </IconButton>
                                        </InputAdornment>
                                    }
                                />
                            </FormControl>
                        }
                    </Grid>

                    <Grid
                        padding={ 2 }
                        container
                        direction="column"
                        alignItems="center"
                    >
                        <FormControl sx={ { width: "20rem" } } variant="outlined">
                            <InputLabel size={ "small" }
                                        htmlFor='password-input'>Password</InputLabel>
                            <OutlinedInput
                                id={ 'password-input' }
                                type={ showPassword ? 'text' : 'password' }
                                value={ newPassRequired ? newPassword : password }
                                size="small"
                                label="Password"
                                onChange={ ( e ) => {
                                    if ( newPassRequired ) {
                                        setNewPassword( e.target.value );
                                    } else {
                                        setPassword( e.target.value )
                                    }
                                } }
                                endAdornment={
                                    <InputAdornment position="end">
                                        <IconButton
                                            aria-label="toggle password visibility"
                                            onClick={ () => setShowPassword( !showPassword ) }
                                            edge="end"
                                            tabIndex={ -1 }
                                        >
                                            { showPassword ? <VisibilityOff/> :
                                                <Visibility/> }
                                        </IconButton>
                                    </InputAdornment>
                                }
                            />
                        </FormControl>
                        { newPassRequired ? null
                            :
                            <Typography padding={ 1 } variant={ "caption" }
                                        color={ "textSecondary" }>
                                <Link href="#" onClick={ () => resetPassword() }>
                                    Forgot Password?
                                </Link>
                            </Typography>
                        }

                    </Grid>
                    { emailTokenRequired ?
                        <Grid
                            container
                            padding={ 2 }
                            direction="column"
                            alignItems="center"
                        >
                            <FormControl sx={ { width: "20rem" } } variant="outlined">
                                <InputLabel size={ "small" }
                                            htmlFor='email-token-input'>Token</InputLabel>
                                <OutlinedInput
                                    id={ 'email-token-input' }
                                    type={ showPassword ? 'text' : 'password' }
                                    value={ emailToken }
                                    size="small"
                                    label="Token"
                                    onChange={ ( e ) => setEmailToken( e.target.value ) }
                                    endAdornment={
                                        <InputAdornment position="end">
                                            <IconButton
                                                aria-label="toggle password visibility"
                                                onClick={ () => setShowPassword( !showPassword ) }
                                                edge="end"
                                                tabIndex={ -1 }
                                            >
                                                { showPassword ? <VisibilityOff/> :
                                                    <Visibility/> }
                                            </IconButton>
                                        </InputAdornment>
                                    }
                                />
                            </FormControl>
                        </Grid>
                        : null
                    }
                    <Grid
                        paddingTop={ 3 }
                        flex={ 1 }
                        container
                        direction="row"
                        justifyContent={ "space-around" }
                        alignItems={ "center" }
                    >
                        { newPassRequired ? null :
                            <OutlinedInput
                                value={ address }
                                size="small"
                                onChange={ ( e ) => setAddress( e.target.value ) }
                                placeholder="empty for random"
                                inputProps={ {
                                    style: { textAlign: "right" }
                                } }
                                endAdornment={
                                    <InputAdornment position="end">
                                        <Typography
                                            variant="h6">{ props.email_domain }</Typography>
                                    </InputAdornment>
                                }
                            />

                        }
                    </Grid>

                    <Grid
                        paddingTop={ 3 }
                        flex={ 1 }
                        container
                        direction="row"
                        justifyContent={ "space-around" }
                        alignItems={ "center" }
                    >

                        <LoadingButton
                            type="submit"
                            loading={ isLoading }
                            variant="outlined"
                            size="large">
                            { newPassRequired ? "Change Password" : "Login" }
                        </LoadingButton>
                    </Grid>
                </Grid>
            </form>
        </Paper>
    )
}

export default Login;