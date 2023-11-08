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
import energyPriceColorUtils from '../utils/energyPriceColor'

// https://www.chartjs.org/docs/latest/charts/bar.html
const VerticalBarChart = ({ title, dataset, labels, fullData }) => {
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
        display: true,
        text: title,
        padding: {
          bottom: 23,
        },
      },
      tooltips: {
        callbacks: {
          label: (tooltipItem) => tooltipItem.yLabel,
        },
      },
      datalabels: {
        anchor: 'end',
        align: 'top',
        formatter: (value, context) => value,
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

  return <Bar options={options} data={data2} height={49} />
}
export default VerticalBarChart
