/* eslint-disable no-use-before-define */
import React from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Bar } from 'react-chartjs-2'
import ChartDataLabels from 'chartjs-plugin-datalabels'
import { useTheme } from '@mui/material/styles'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import energyPriceColorUtils from '../utils/energyPriceColor'

// https://www.chartjs.org/docs/latest/charts/bar.html
const VerticalBarChart = ({
  title,
  dataset,
  labels,
  fullData,
  showLabels,
  headerControls,
}) => {
  const theme = useTheme()

  ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ChartDataLabels
  )

  const options = {
    responsive: true,
    plugins: {
      legend: {
        // position: 'top',
        display: false,
      },
      title: {
        display: false,
      },
      tooltips: {
        callbacks: {
          label: (tooltipItem) => tooltipItem.yLabel,
        },
      },
      datalabels: {
        anchor: 'end',
        align: (context) => {
          // If showLabels array is provided and this label should be hidden, return default
          if (showLabels && !showLabels[context.dataIndex]) {
            return 'top'
          }
          // Alternate between alignments for visible labels to avoid collision
          if (showLabels) {
            // Count visible labels up to this point
            let visibleCount = 0
            for (let i = 0; i <= context.dataIndex; i++) {
              if (showLabels[i]) {
                visibleCount++
              }
            }
            // Alternate between top and higher position
            return visibleCount % 2 === 0 ? 'top' : 'top'
          }
          return 'top'
        },
        offset: (context) => {
          // If showLabels array is provided and this label should be hidden, return 0
          if (showLabels && !showLabels[context.dataIndex]) {
            return 0
          }
          // Alternate offset for visible labels using 3 levels
          if (showLabels) {
            let visibleCount = 0
            for (let i = 0; i <= context.dataIndex; i++) {
              if (showLabels[i]) {
                visibleCount++
              }
            }
            // Cycle through three different vertical positions
            const level = visibleCount % 3
            if (level === 0) return 0
            if (level === 1) return 20
            return 40
          }
          return 0
        },
        formatter: (value, context) => {
          // If showLabels array is provided, only show labels at specified indices
          if (showLabels && !showLabels[context.dataIndex]) {
            return null
          }
          return value
        },
        font: {
          color: 'white',
          weight: 'bold',
        },
      },
    },
  }

  const today = new Date()
  today.setHours(today.getHours() - 1)

  /**
   * @param {number} price
   * @param {number} index
   * @param {Date} today
   * @returns {string}
   */
  const getBackgroundColor = (price, index, today) => {
    if (isEnergyPricePastTime(index, today)) {
      return 'gray'
    }
    return energyPriceColorUtils.getByPrice(
      price,
      theme.palette.energyPriceColors
    )
  }

  /**
   * @param {number} index
   * @param {Date} today
   * @returns {string}
   */
  const isEnergyPricePastTime = (index, today) => {
    if (fullData[index].date < today) {
      return true
    }
    return false
  }

  const data2 = {
    labels,
    datasets: [
      {
        data: dataset,
        backgroundColor: dataset.map((value, index) =>
          getBackgroundColor(value, index, today)
        ),
      },
    ],
  }

  return (
    <>
      {headerControls && (
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={0.5}
          flexWrap="wrap"
          gap={0.5}
        >
          <Typography component="div" sx={{ fontSize: '12px' }}>
            {title}
          </Typography>
          <Box display="flex" gap={0.5} flexWrap="wrap">
            {headerControls}
          </Box>
        </Box>
      )}
      <Bar options={options} data={data2} height={44} />
    </>
  )
}
export default VerticalBarChart
