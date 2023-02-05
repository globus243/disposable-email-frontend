import React, { useEffect } from 'react';
// @ts-ignore
import parse from "emailjs-mime-parser"
import { getMailAttachments, getMailContents } from "../../utils/helper";
import ReplyIcon from '@mui/icons-material/Reply';
import DownloadIcon from '@mui/icons-material/Download';
import AttachEmailIcon from '@mui/icons-material/AttachEmail';
import FolderZipIcon from '@mui/icons-material/FolderZip';
import ImageIcon from '@mui/icons-material/Image';
import DescriptionIcon from '@mui/icons-material/Description';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import {
    Card,
    CardContent,
    CircularProgress,
    Grid,
    IconButton,
    Paper,
    Tooltip,
    Typography,
    Divider
} from "@mui/material";
import EmailComposer from "../Composer";
import { DecodedEmailObject } from "../../utils/types";
import { Amplify } from "aws-amplify";

type ViewerProps = {
    apiEndpoint: string;
    address: string;
    messageId: string;
}

function EmailViewer( props: ViewerProps ) {
    const [ isLoading, setIsLoading ] = React.useState( false );
    const [ message, setMessage ] = React.useState<DecodedEmailObject>( {
        fromName: '',
        fromAddress: '',
        toName: '',
        toAddress: '',
        subject: '',
        text: '',
        attachments: [],
    } );
    const [ rawMessage, setRawMessage ] = React.useState( '' );
    const [ reply, setReply ] = React.useState( false );

    useEffect( () => {
        async function getMessage() {
            if ( props.address !== '' && props.messageId !== '' ) {
                setIsLoading( true );
                const session = await Amplify.Auth.currentSession();
                const token = session.getIdToken().getJwtToken();
                fetch( props.apiEndpoint + props.address + '/' + props.messageId,
                    { headers: { Authorization: token } } )
                    .then( res => res.text() )
                    .then( ( data ) => {
                        setRawMessage( data );
                        let parsed = parse( data );
                        setMessage( {
                            fromName: parsed.headers.from[ 0 ].value[ 0 ].name,
                            fromAddress: parsed.headers.from[ 0 ].value[ 0 ].address,
                            toName: parsed.headers.to[ 0 ].value[ 0 ].name,
                            toAddress: parsed.headers.to[ 0 ].value[ 0 ].address,
                            subject: parsed.headers.subject[ 0 ].value,
                            text: getMailContents( parsed ),
                            attachments: getMailAttachments( parsed )
                        } );
                    } ).catch( ( error ) => {
                    console.error( 'Error:', error );
                } ).finally( () => {
                    setIsLoading( false )
                } );
            }
        }

        setReply( false );
        getMessage();
    }, [ props ] );

    function capitalize( string: string, lower: Boolean ) {
        return ( lower ? string.toLowerCase() : string ).replace( /(?:^|\s)\S/g, function ( a ) {
            return a.toUpperCase();
        } );
    }

    function formatAddress( name: string, address: string, label: string, bold: boolean ) {
        let capitalized = capitalize( name, false );
        if ( name === '' ) {
            return ( <div><i>{ label }</i>{ bold ? <b>{ address }</b> : address }</div> );
        } else {
            return ( <div><i>{ label }</i>{ bold ?
                <b>{ capitalized }</b> : capitalized } ({ address })</div> );
        }
    }

    if ( reply ) {
        return (
            <EmailComposer
                apiEndpoint={ props.apiEndpoint }
                fromAddress={ props.address }
                toAddress={ [ message.fromAddress ] }
                prefillText={ message.text }
                subject={ "Re: " + message.subject }
            />
        );

    }
    if ( isLoading ) {
        return (
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
        )
    }
    if ( props.messageId === '' ) {
        return (
            <Card>
                <CardContent>
                    <Grid
                        container
                        width={ 1 }
                        direction="column"
                        alignItems="center"
                        justifyContent="center"
                    >
                        <Typography variant="body1">
                            No mail selected
                        </Typography>
                    </Grid>
                </CardContent>
            </Card>
        )
    } else {
        return (
            <>
                <Card>
                    <CardContent>
                        <Typography variant="h6">
                            { message.subject }
                        </Typography>
                        <Typography variant="body1">
                            { formatAddress( message.fromName, message.fromAddress, '', true ) }
                        </Typography>
                        <Typography variant="body1">
                            { formatAddress( message.toName, message.toAddress, 'to ', false ) }
                        </Typography>
                    </CardContent>
                </Card>
                <Card style={ { marginTop: "0.5rem", marginBottom: "0.5rem" } }>
                    <Grid
                        container
                        direction="row"
                        justifyContent="flex-start"
                    >
                        <Tooltip title={ "Reply" }>
                            <IconButton onClick={ () => setReply( true ) }>
                                <ReplyIcon/>
                            </IconButton>
                        </Tooltip>
                        <Divider orientation="vertical" variant="middle" flexItem/>
                        <Tooltip title={ "Download raw email file" }>
                            <IconButton onClick={ () =>
                                window.open( URL.createObjectURL(
                                    new Blob( [ rawMessage ] ) ) ) }>
                                <DownloadIcon/>
                            </IconButton>
                        </Tooltip>
                        { message.attachments.map( ( attachment, index ) => (
                            <>
                                <Divider orientation="vertical" variant="middle"
                                         flexItem/>
                                <Tooltip
                                    title={ attachment.name || "Download attachment" }>
                                    <IconButton key={ index }
                                                onClick={ () =>
                                                    window.open(
                                                        URL.createObjectURL(
                                                            new Blob(
                                                                [ attachment.content ],
                                                                { type: attachment.contentType }
                                                            ) ) ) }>
                                        { getIconForContentType( attachment.contentType ) }
                                    </IconButton>
                                </Tooltip>
                            </>
                        ) ) }
                    </Grid>
                </Card>

                <div>
                    <Paper elevation={ 3 }>
                        <div
                            className="body"
                            style={ {
                                padding: "1rem",
                                whiteSpace: "pre-wrap",
                                minHeight: "60vh",
                                maxHeight: "60vh",
                                overflow: "auto"
                            } }
                            dangerouslySetInnerHTML={ { __html: message.text } }></div>
                    </Paper>
                </div>
            </>
        )
    }
}

function getIconForContentType( contentType: string ) {
    if ( contentType.includes( "image" ) ) {
        return <ImageIcon/>;
    }
    if ( contentType.includes( "pdf" ) ) {
        return <PictureAsPdfIcon/>;
    }
    if ( contentType.includes( "text" ) || contentType.includes( "msword" ) ) {
        return <DescriptionIcon/>;
    }
    // rar is octet-stream and is not detected
    let archiveKeywords = [ "zip", "7z", "tar", "gzip", "bzip2" ];
    if ( archiveKeywords.some( ( keyword ) => contentType.includes( keyword ) ) ) {
        return <FolderZipIcon/>;
    }
    return <AttachEmailIcon/>;
}

export default EmailViewer;