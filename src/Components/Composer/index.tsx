import React from 'react';
import {
    Badge,
    Card,
    CardContent,
    Grid, IconButton,
    InputAdornment,
    OutlinedInput,
    Paper,
} from '@mui/material';
import LoadingButton from '@mui/lab/LoadingButton';
import SendIcon from "@mui/icons-material/Send";
import AttachFileIcon from '@mui/icons-material/AttachFile';
import { Editor } from "react-draft-wysiwyg";
import "react-draft-wysiwyg/dist/react-draft-wysiwyg.css";
import draftToHtml from 'draftjs-to-html';
import htmlToDraft from 'html-to-draftjs';
import { ContentState, convertToRaw, EditorState } from 'draft-js';
import 'react-notifications/lib/notifications.css';
import { Amplify } from "aws-amplify";

type ComposerProps = {
    apiEndpoint: string;
    fromAddress: string;
    toAddress?: string[];
    prefillText?: string;
    subject?: string;
}

type ButtonStyle = {
    color: 'normal' | 'success' | 'error',
    loading: boolean,
};

function EmailComposer( props: ComposerProps ) {

    const [ editorState, setEditorState ] = React.useState( prefillTextToEditorState( props.prefillText ) );
    const [ toAddresses, setToAddresses ] = React.useState<string[]>( props.toAddress || [] );
    const [ subject, setSubject ] = React.useState( props.subject || '' );
    const [ attachments, setAttachments ] = React.useState( [] as
        { name: string, type: string, size: number, content: string }[] );
    const [ buttonStyle, setButtonStyle ] = React.useState<ButtonStyle>( {
        color: 'normal',
        loading: false
    } );
    let timeOutId: number = -1;

    function prefillTextToEditorState( text: string | undefined ) {
        if ( !text ) {
            return EditorState.createEmpty();
        }
        const contentBlock = htmlToDraft( text );
        const contentState = ContentState.createFromBlockArray( contentBlock.contentBlocks );
        return EditorState.createWithContent( contentState );
    }

    const file2Base64 = ( file: File ): Promise<string> => {
        return new Promise<string>( ( resolve, reject ) => {
            const reader = new FileReader();
            reader.readAsDataURL( file );
            reader.onload = () => resolve( reader.result?.toString().split( ',' )[ 1 ] || '' );
            reader.onerror = error => reject( error );
        } )
    }


    async function sendEmail() {
        if ( toAddresses.length !== 0 ) {
            setButtonStyle( { color: 'normal', loading: true } );
            window.clearTimeout( timeOutId );
            const session = await Amplify.Auth.currentSession();
            const token = session.getIdToken().getJwtToken();
            const rawDraft = convertToRaw( editorState.getCurrentContent() )
            const blocks = rawDraft.blocks;
            const textDraft = blocks.map( block => ( !block.text.trim() && '\n' ) || block.text ).join( '\n' );
            const htmlDraft = draftToHtml( rawDraft );

            const requestBody = {
                toAddress: toAddresses,
                fromAddress: props.fromAddress,
                subject: subject,
                emailBodyHtml: htmlDraft,
                emailBodyText: textDraft,
                attachments: attachments,
            }

            const headers = {
                method: 'POST',
                headers: { Authorization: token },
                body: JSON.stringify( requestBody )
            }

            fetch( props.apiEndpoint + 'send/', headers )
                .then( res => res.text() )
                .then( ( data ) => {
                    if ( data.includes( "Email sent successfully" ) ) {
                        setButtonStyle( { color: 'success', loading: false } );
                    } else {
                        setButtonStyle( { color: 'error', loading: false } );
                    }
                } )
                .catch( e => {
                    console.error( e );
                    setButtonStyle( { color: 'error', loading: false } );
                } )
                .finally( () => {
                    timeOutId = window.setTimeout( () => {
                        setButtonStyle( { ...buttonStyle, color: 'normal' } );
                    }, 5000 );
                } );
        }
    }

    return (
        <form onSubmit={ () => null }>
            <Card>
                <CardContent>
                    <Grid container direction={ "row" }
                          justifyContent={ "space-between" }
                          alignItems={ "center" }>
                        <Grid item width={ "80%" }>
                            <OutlinedInput
                                fullWidth={ true }
                                value={ toAddresses }
                                onChange={ ( e ) => {
                                    setToAddresses( e.target.value.split( ',' ) );
                                } }
                                placeholder={ props.fromAddress }
                                inputProps={ {
                                    style: { textAlign: "left" }
                                } }
                                startAdornment={ <InputAdornment
                                    position="start">To: </InputAdornment> }

                            />
                        </Grid>
                        <Grid item width={ "15%" }>
                            { buttonStyle.color === 'normal' &&
                                <LoadingButton
                                    fullWidth={ true }
                                    tabIndex={ -1 }
                                    size="large"
                                    onClick={ () => sendEmail() }
                                    endIcon={ <SendIcon/> }
                                    loading={ buttonStyle.loading }
                                    disabled={ buttonStyle.loading }
                                    loadingPosition="end"
                                    variant="contained">
                                    Send
                                </LoadingButton> }

                            { buttonStyle.color === 'success' &&
                                <LoadingButton
                                    fullWidth={ true }
                                    tabIndex={ -1 }
                                    size="large"
                                    color="success"
                                    onClick={ () => sendEmail() }
                                    loadingPosition="end"
                                    variant="contained">
                                    Success!
                                </LoadingButton> }

                            { buttonStyle.color === 'error' &&
                                <LoadingButton
                                    fullWidth={ true }
                                    tabIndex={ -1 }
                                    size="large"
                                    color="error"
                                    onClick={ () => sendEmail() }
                                    loadingPosition="end"
                                    variant="contained">
                                    Error!
                                </LoadingButton> }
                        </Grid>
                    </Grid>
                </CardContent>
                <CardContent>
                    <OutlinedInput
                        fullWidth={ true }
                        value={ subject }
                        onChange={ ( e ) => setSubject( e.target.value ) }
                        startAdornment={ <InputAdornment
                            position="start">Subject: </InputAdornment> }
                        inputProps={ {
                            style: { textAlign: "left" }
                        } }/>
                </CardContent>
            </Card>

            <Paper elevation={ 3 }>
                <Editor
                    editorState={ editorState }
                    wrapperStyle={ { padding: "1rem", marginTop: "1rem" } }
                    editorStyle={ {
                        minHeight: "50vh",
                        maxHeight: "50vh",
                        padding: "1rem",
                        overflow: "auto",
                    } }
                    toolbarCustomButtons={ [
                        <IconButton tabIndex={ -1 }
                                    aria-label="upload picture"
                                    component="label">
                            <input
                                onChange={ async ( e ) => {
                                    const newAttachments = Array.from( e.target.files || [] );
                                    const combinedSize = newAttachments.reduce( ( acc, file ) => acc + file.size, 0 );
                                    if ( combinedSize < 5 * 1024 * 1024 ) {
                                        const attachmentsWithContent =
                                            await Promise.all( newAttachments.map( async ( file ) => {
                                                return {
                                                    name: file.name,
                                                    type: file.type,
                                                    size: file.size,
                                                    content: await file2Base64( file )
                                                }
                                            } ) );
                                        setAttachments( attachmentsWithContent );
                                    } else {
                                        alert( "Combined file size must be lower than 5MB" );
                                    }
                                } }
                                hidden
                                multiple={ true }
                                size={ 5 * 1024 * 1024 }
                                accept="image/*,application/pdf,application/zip,application/x-7z-compressed,application/x-rar-compressed,application/x-tar,application/x-gzip,application/x-bzip,application/x-bzip2"
                                type="file"/>
                            <Badge badgeContent={ attachments.length }
                                   color="primary">
                                <AttachFileIcon/>
                            </Badge>
                        </IconButton>
                    ] }
                    onEditorStateChange={ ( newEs ) => setEditorState( newEs ) }/>
            </Paper>
        </form>
    )
}

export default EmailComposer;