import React from 'react'
import { Grid, IconButton, Typography } from '@mui/material'
import { observer } from 'mobx-react'
import { getParent } from 'mobx-state-tree'
import { makeStyles } from 'tss-react/mui'

// icons
import FilterIcon from '@mui/icons-material/FilterList'
import CloseIcon from '@mui/icons-material/Close'

const useStyles = makeStyles()(theme => ({
  columnName: {
    verticalAlign: 'middle',
    paddingRight: '0.3em',
  },
  columnFilter: {
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    boxSizing: 'border-box',
    width: '100%',
    position: 'relative',
  },
  filterIcon: {
    position: 'relative',
    top: '12px',
  },
  filterIconBg: {
    background: theme.palette.tertiary.main,
    color: 'white',
    padding: theme.spacing(1.5),
  },
}))

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function FilterOperations({ filterModel }: { filterModel: any }) {
  if (filterModel) {
    return <filterModel.ReactComponent filterModel={filterModel} />
  }
  return null
}

const ColumnFilterControls = observer(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ({ viewModel, filterModel, columnNumber, height }: any) => {
    const { classes } = useStyles()

    const columnDefinition = viewModel.spreadsheet.columns[columnNumber]
    if (!columnDefinition) {
      throw new Error('no column definition! filters are probably out of date')
    }
    return (
      <Grid
        container
        direction="row"
        className={classes.columnFilter}
        style={{ height }}
      >
        <Grid item className={classes.filterIconBg}>
          <FilterIcon className={classes.filterIcon} />
        </Grid>
        <Grid item>
          <IconButton
            onClick={() =>
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              getParent<any>(filterModel, 2).removeColumnFilter(filterModel)
            }
            title="remove filter"
            color="secondary"
          >
            <CloseIcon />
          </IconButton>
          <Typography className={classes.columnName} component="span">
            {columnDefinition.name}
          </Typography>{' '}
          <FilterOperations filterModel={filterModel} />
        </Grid>
      </Grid>
    )
  },
)

export default ColumnFilterControls
