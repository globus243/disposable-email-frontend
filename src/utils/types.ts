export type EmailObject = {
    commonHeaders: {
        from: string[];
        to: string[];
        subject: string;
        date: string;
        messageId: string;
        returnPath: string;
    }
    destination: string;
    isNew: boolean;
    messageId: string;
    source: string;
    timestamp: string;
}

export type AddressObject = {
    redirect_email: string;
    redirect: boolean;
    address: string;
    ttl: number;
}

export type DecodedEmailObject = {
    fromName: string;
    fromAddress: string;
    toName: string;
    toAddress: string;
    subject: string;
    text: string;
    attachments: DecodedEmailAttachmentObject[];
}

export type DecodedEmailAttachmentObject = {
    name: string;
    content: string;
    contentType: string;
}