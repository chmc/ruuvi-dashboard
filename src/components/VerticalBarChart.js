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

// https://www.chartjs.org/docs/latest/charts/bar.html
const VerticalBarChart = ({ title, dataset, labels, fullData }) => {
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

  const getBackgroundColor = (value, index) => {
    if (fullData[index].date < today) {
      return 'gray'
    }
    if (value <= 5) {
      // return 'rgba(55, 252, 52, 0.3)'
      // Green
      return 'rgba(0, 204, 136, 0.5)'
    }
    if (value > 5 && value <= 13) {
      // A lighter green transitioning to yellow
      return 'rgba(158, 229, 112, 0.5)'
    }
    if (value > 13 && value <= 15) {
      // Yellow
      return 'rgba(255, 221, 51, 0.5)'
    }
    if (value > 15 && value <= 18) {
      // A lighter yellow transitioning to red
      return 'rgba(255, 98, 98, 0.8)'
    }
    if (value > 18 && value <= 20) {
      // Dark Red
      return 'rgba(255, 30, 30, 0.7)'
    }
    // Dark Red
    return 'rgba(255, 30, 30, 1)'
  }

  const data2 = {
    labels,
    datasets: [
      {
        data: dataset,
        backgroundColor: dataset.map((value, index) =>
          getBackgroundColor(value, index)
        ),
      },
    ],
  }

  return <Bar options={options} data={data2} height={49} />
}
export default VerticalBarChart
