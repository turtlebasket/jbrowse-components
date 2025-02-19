import React, { useState } from 'react'
import { Checkbox, IconButton, Tooltip, FormControlLabel } from '@mui/material'
import { observer } from 'mobx-react'
import { getParent, Instance } from 'mobx-state-tree'
import { grey, indigo } from '@mui/material/colors'
import { makeStyles } from 'tss-react/mui'

// icons
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import CropFreeIcon from '@mui/icons-material/CropFree'
import ArrowDropDown from '@mui/icons-material/ArrowDropDown'

// locals
import SpreadsheetStateModel from '../models/Spreadsheet'
import RowStateModel from '../models/Row'
import ColumnMenu from './ColumnMenu'
import RowMenu from './RowMenu'
import { LoadingEllipses } from '@jbrowse/core/ui'

type SpreadsheetModel = Instance<typeof SpreadsheetStateModel>
type RowModel = Instance<typeof RowStateModel>

function letterFor(n: number) {
  return String.fromCharCode(n + 65)
}

export function numToColName(num: number) {
  if (num >= 0) {
    if (num < 26) {
      return letterFor(num)
    }
    if (num < 27 * 26) {
      return letterFor(Math.floor(num / 26 - 1)) + letterFor(num % 26)
    }
  }

  throw new RangeError('column number out of range')
}

const useStyles = makeStyles()(theme => {
  return {
    root: {
      position: 'relative',
      marginBottom: theme.spacing(1),
      background: grey[500],
      overflow: 'auto',
    },
    dataTable: {
      borderCollapse: 'collapse',
      borderSpacing: 0,
      boxSizing: 'border-box',
      '& td': {
        border: `1px solid ${grey[300]}`,
        padding: '0.2rem',
        maxWidth: '50em',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      },
    },
    dataTableBody: {
      background: 'white',
    },
    rowNumCell: {
      background: grey[200],
      textAlign: 'left',
      border: `1px solid ${grey[300]}`,
      position: 'relative',
      padding: '0 2px 0 0',
      whiteSpace: 'nowrap',
      userSelect: 'none',
    },
    rowNumber: {
      fontWeight: 'normal',
      display: 'inline-block',
      flex: 'none',
      paddingRight: '20px',
      margin: 0,
      whiteSpace: 'nowrap',
    },
    rowMenuButton: {
      padding: 0,
      margin: 0,
      position: 'absolute',
      right: 0,
      display: 'inline-block',
      whiteSpace: 'nowrap',
      flex: 'none',
    },
    rowMenuButtonIcon: {},
    rowSelector: {
      position: 'relative',
      top: '-2px',
      margin: 0,
      padding: '0 0.2rem',
    },
    columnHead: {
      fontWeight: 'normal',
      background: grey[200],
      border: `1px solid ${grey[300]}`,
      position: 'sticky',
      top: '-1px',
      zIndex: 2,
      whiteSpace: 'nowrap',
      // padding: [[0, theme.spacing(1)]],
    },
    sortIndicator: {
      position: 'relative',
      top: '0.2rem',
      fontSize: '1rem',
    },
    columnButtonContainer: {
      display: 'none',
      position: 'absolute',
      right: 0,
      top: 0,
      background: grey[100],
      height: '100%',
      boxSizing: 'border-box',
      borderLeft: `1px solid ${grey[300]}`,
    },
    columnButton: {
      padding: 0,
    },
    topLeftCorner: {
      background: grey[300],
      position: 'sticky',
      top: '-1px',
      zIndex: 2,
      minWidth: theme.spacing(2),
      textAlign: 'left',
    },
    dataRowSelected: {
      background: indigo[100],
      '& th': {
        background: indigo[100],
      },
    },
    emptyMessage: { captionSide: 'bottom' },
  }
})

const CellData = observer(
  ({
    cell,
    spreadsheetModel,
    columnNumber,
  }: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cell: any
    spreadsheetModel: SpreadsheetModel
    columnNumber: number
  }) => {
    const ret = spreadsheetModel.columns[columnNumber]
    if (ret && 'dataType' in ret && ret.dataType.DataCellReactComponent) {
      return (
        <ret.dataType.DataCellReactComponent
          cell={cell}
          dataType={ret.dataType}
          columnNumber={columnNumber}
          spreadsheet={spreadsheetModel}
        />
      )
    }

    return cell.text
  },
)

const DataRow = observer(
  ({
    rowModel,
    rowNumber,
    spreadsheetModel,
  }: {
    rowModel: RowModel
    rowNumber: string
    spreadsheetModel: SpreadsheetModel
  }) => {
    const { classes } = useStyles()
    const { hideRowSelection, columnDisplayOrder } = spreadsheetModel
    let rowClass = ''
    if (rowModel.isSelected) {
      rowClass += `${classes.dataRowSelected}`
    }

    function labelClick(evt: React.MouseEvent) {
      rowModel.toggleSelect()
      evt.stopPropagation()
      evt.preventDefault()
    }

    return (
      <tr className={rowClass}>
        <th className={classes.rowNumCell} onClick={labelClick}>
          {hideRowSelection ? (
            <FormControlLabel
              className={classes.rowNumber}
              control={
                <Checkbox
                  className={classes.rowSelector}
                  checked={rowModel.isSelected}
                  onClick={labelClick}
                />
              }
              label={rowModel.id}
            />
          ) : null}
          <IconButton
            className={classes.rowMenuButton}
            onClick={event => {
              spreadsheetModel.setRowMenuPosition({
                anchorEl: event.currentTarget,
                rowNumber,
              })
              event.preventDefault()
              event.stopPropagation()
            }}
            color="secondary"
          >
            <ArrowDropDown className={classes.rowMenuButtonIcon} />
          </IconButton>
        </th>
        {columnDisplayOrder.map(colNumber => (
          <td key={colNumber}>
            <CellData
              cell={rowModel.cellsWithDerived[colNumber]}
              spreadsheetModel={spreadsheetModel}
              columnNumber={colNumber}
            />
          </td>
        ))}
      </tr>
    )
  },
)

function SortIndicator({
  model,
  columnNumber,
}: {
  model: SpreadsheetModel
  columnNumber: number
}) {
  const { classes } = useStyles()
  const sortSpec = model.sortColumns.find(c => c.columnNumber === columnNumber)

  if (sortSpec) {
    const { descending } = sortSpec
    return descending ? (
      <KeyboardArrowUpIcon className={classes.sortIndicator} />
    ) : (
      <KeyboardArrowDownIcon className={classes.sortIndicator} />
    )
  }
  return null
}

const DataTableBody = observer(
  ({
    rows,
    spreadsheetModel,
    page,
    rowsPerPage,
  }: {
    rows: RowModel[]
    spreadsheetModel: SpreadsheetModel
    page: number
    rowsPerPage: number
  }) => {
    const { classes } = useStyles()
    return (
      <tbody className={classes.dataTableBody}>
        {rows.slice(rowsPerPage * page, rowsPerPage * (page + 1)).map(row => (
          <DataRow
            key={row.id}
            rowNumber={row.id}
            spreadsheetModel={spreadsheetModel}
            rowModel={row}
          />
        ))}
      </tbody>
    )
  },
)

interface ColMenu {
  colNumber: number
  anchorEl: HTMLElement
}

const DataTable = observer(
  ({
    model,
    page,
    rowsPerPage,
  }: {
    model: SpreadsheetModel
    page: number
    rowsPerPage: number
  }) => {
    const { columnDisplayOrder, columns, hasColumnNames, rowSet } = model
    const { classes } = useStyles()

    // column menu active state
    const [currentColumnMenu, setColumnMenu] = useState<ColMenu | null>(null)
    function columnButtonClick(
      colNumber: number,
      evt: React.MouseEvent<HTMLElement>,
    ) {
      setColumnMenu({
        colNumber,
        anchorEl: evt.currentTarget,
      })
    }

    // column header hover state
    const [currentHoveredColumn, setHoveredColumn] = useState<number>()
    function columnHeaderMouseOver(colNumber: number) {
      setHoveredColumn(colNumber)
    }
    function columnHeaderMouseOut() {
      setHoveredColumn(undefined)
    }

    const totalRows = rowSet.count
    const rows = rowSet.sortedFilteredRows

    return (
      <>
        <ColumnMenu
          viewModel={getParent(model)}
          spreadsheetModel={model}
          currentColumnMenu={currentColumnMenu}
          setColumnMenu={setColumnMenu}
        />
        <RowMenu viewModel={getParent(model)} spreadsheetModel={model} />
        <table className={classes.dataTable}>
          <thead>
            <tr>
              <th className={classes.topLeftCorner}>
                <Tooltip title="Unselect all" placement="right">
                  <span>
                    <IconButton
                      onClick={model.unselectAll}
                      disabled={!model.rowSet.selectedCount}
                      color="secondary"
                    >
                      <CropFreeIcon />
                    </IconButton>
                  </span>
                </Tooltip>
              </th>
              {columnDisplayOrder.map(colNumber => (
                <th
                  className={classes.columnHead}
                  key={colNumber}
                  onMouseOver={columnHeaderMouseOver.bind(null, colNumber)}
                  onMouseOut={columnHeaderMouseOut.bind(null, colNumber)}
                >
                  <SortIndicator model={model} columnNumber={colNumber} />
                  {(hasColumnNames && columns[colNumber]?.name) ||
                    numToColName(colNumber)}
                  <div
                    className={classes.columnButtonContainer}
                    style={{
                      display:
                        currentHoveredColumn === colNumber ||
                        currentColumnMenu?.colNumber === colNumber
                          ? 'block'
                          : 'none',
                    }}
                  >
                    <IconButton
                      className={classes.columnButton}
                      onClick={columnButtonClick.bind(null, colNumber)}
                      color="secondary"
                    >
                      <ArrowDropDown />
                    </IconButton>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <DataTableBody
            rows={rows}
            spreadsheetModel={model}
            page={page}
            rowsPerPage={rowsPerPage}
          />
          {!rows.length ? (
            <caption className={classes.emptyMessage}>
              {totalRows ? 'no rows match criteria' : 'no rows present'}
            </caption>
          ) : null}
        </table>
      </>
    )
  },
)

const Spreadsheet = observer(
  ({
    model,
    height,
    page,
    rowsPerPage,
  }: {
    model: SpreadsheetModel
    height: number
    page: number
    rowsPerPage: number
  }) => {
    const { classes } = useStyles()

    return (
      <div className={classes.root} style={{ height }}>
        {model?.rowSet?.isLoaded && model.initialized ? (
          <DataTable model={model} page={page} rowsPerPage={rowsPerPage} />
        ) : (
          <LoadingEllipses variant="h4" />
        )}
      </div>
    )
  },
)

export default Spreadsheet
