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
const VerticalBarChart = ({ dataset, labels, fullData }) => {
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
        text: 'Energy price c/kWh',
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
      return 'rgba(55, 252, 52, 0.3)'
    }
    if (value > 5 && value <= 10) {
      return 'rgba(255, 205, 66, 0.3)'
    }
    return 'rgba(255, 50, 50, 0.3)'
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

  return <Bar options={options} data={data2} height={50} />
}
export default VerticalBarChart
