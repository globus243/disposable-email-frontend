import { DecodedEmailAttachmentObject } from "./types";

export function getMailContents( parsed: any ) {
    let result = '';

    for ( const child of parsed.childNodes ) {
        if ( child.contentType.value === 'multipart/alternative' ) {
            if ( child.childNodes.length > 0 ) {
                result = getMailContents( child );
                if ( result !== '' ) {
                    break;
                }
            }
        }
    }

    for ( const child of parsed.childNodes ) {
        if ( child.contentType.value === 'multipart/related' ) {
            if ( child.childNodes.length > 0 ) {
                result = getMailContents( child );
                if ( result !== '' ) {
                    break;
                }
            }
        }
    }

    if ( result === '' ) {
        for ( const child of parsed.childNodes ) {
            if ( child.contentType.value === 'text/html' ) {
                result = DecodeUint8arr( child.content );
                break;
            }
        }
    }

    if ( result === '' ) {
        for ( const child of parsed.childNodes ) {
            if ( child.contentType.value === 'text/plain' ) {
                result = DecodeUint8arr( child.content );
                break;
            }
        }
    }

    if ( result === '' ) {
        if ( parsed.childNodes.length === 0 ) {
            if ( parsed.contentType.value === 'text/html' ) {
                result = DecodeUint8arr( parsed.content );
            }
        }
    }

    return result
}

export function getMailAttachments( parsed: any ) {
    let attachments: DecodedEmailAttachmentObject[] = [];

    let excludedContentTypes = [
        'text/html', "text/plain", "multipart/alternative", "multipart/related" ];

    for ( const child of parsed.childNodes ) {

        if ( excludedContentTypes.indexOf( child.contentType.value ) === -1 ) {
            attachments.push( {
                name: child.contentType.params.name,
                content: child.content,
                contentType: child.contentType.value
            } );
        }
    }

    return attachments;
}

function DecodeUint8arr( uint8array: Uint8Array ) {
    return new TextDecoder( "utf-8" ).decode( uint8array );
}

/**
 * function that takes in a unix time stamp and returns the time until then in a
 * human-readable all calculations in UTC time format
 * e.g. in 1 day, in 2 hours, in 5 minutes, in 3 seconds
 * @param {Date | number} unixTime date object
 * @returns {string} human readable time
 */
export function timeTo( unixTime: number | Date ) {
    const now = new Date();
    unixTime = unixTime instanceof Date ? unixTime.getTime() : unixTime;

    const diff = unixTime * 1000 - now.getTime();

    const days = Math.floor( diff / ( 1000 * 60 * 60 * 24 ) );
    const hours = Math.floor( ( diff % ( 1000 * 60 * 60 * 24 ) ) / ( 1000 * 60 * 60 ) );
    const minutes = Math.floor( ( diff % ( 1000 * 60 * 60 ) ) / ( 1000 * 60 ) );
    const seconds = Math.floor( ( diff % ( 1000 * 60 ) ) / 1000 );

    if ( days > 0 ) {
        return `in ${ days } day${ days > 1 ? 's' : '' }`;
    }
    if ( hours > 0 ) {
        return `in ${ hours } hour${ hours > 1 ? 's' : '' }`;
    }
    if ( minutes > 0 ) {
        return `in ${ minutes } minute${ minutes > 1 ? 's' : '' }`;
    }
    if ( seconds > 0 ) {
        return `in ${ seconds } second${ seconds > 1 ? 's' : '' }`;
    }
    return 'now';
}


export function secondsSince( date: Date ) {
    return Math.floor( ( new Date().getTime() - date.getTime() ) / 1000 );
}