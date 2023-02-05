import {
    Markunread,
    MarkEmailRead
} from "@mui/icons-material";
import { GridCellParams, GridColDef } from "@mui/x-data-grid";

export let defaultDataGridColumns: GridColDef[] = [ {
    field: 'count', headerName: '#', maxWidth: 20,
    renderCell: ( params: GridCellParams ) => {
        if ( params.row.isNew === "true" ) {
            return <strong> { params.row.count } </strong>
        } else {
            return params.row.count;
        }
    }
}, {
    field: 'id', headerName: 'ID', maxWidth: 50, hide: true, flex: 1,
    renderCell: ( params: GridCellParams ) => {
        if ( params.row.isNew === "true" ) {
            return <strong> { params.row.id } </strong>
        } else {
            return params.row.id;
        }
    }
}, {
    field: 'isNew', headerName: 'Read', maxWidth: 50, hide: true, flex: 1,
    renderCell: ( params: GridCellParams ) => {
        if ( params.row.isNew === "true" ) {
            return <Markunread/>
        } else {
            return <MarkEmailRead/>
        }
    }
}, {
    field: 'from', headerName: 'From', maxWidth: 200, flex: 1,
    renderCell: ( params: GridCellParams ) => {
        if ( params.row.isNew === "true" ) {
            return <strong> { params.row.from } </strong>
        } else {
            return params.row.from;
        }
    }
}, {
    field: 'subject', headerName: 'Subject', flex: 1,
    renderCell: ( params: GridCellParams ) => {
        if ( params.row.isNew === "true" ) {
            return <strong> { params.row.subject } </strong>
        } else {
            return params.row.subject;
        }
    }
}, {
    field: 'date', headerName: 'Date', maxWidth: 200, flex: 1,
    align: 'right', headerAlign: 'right',
    renderCell: ( params: GridCellParams ) => {
        if ( params.row.isNew === "true" ) {
            return <strong> { params.row.date } </strong>
        } else {
            return params.row.date;
        }
    }
} ];