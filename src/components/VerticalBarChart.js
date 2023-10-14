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

// https://www.chartjs.org/docs/latest/charts/bar.html
const VerticalBarChart = ({ dataset, labels }) => {
  ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
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
        text: 'Energy price',
      },
      tooltips: {
        callbacks: {
          label: (tooltipItem) => tooltipItem.yLabel,
        },
      },
    },
  }

  // const labels = [
  //   'January',
  //   'February',
  //   'March',
  //   'April',
  //   'May',
  //   'June',
  //   'July',
  // ]

  // const dataset = [100, 300, 600, 83, 400, 900]
  const getBackgroundColor = (value) => {
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
        backgroundColor: dataset.map((value) => getBackgroundColor(value)),
      },
    ],
  }

  return <Bar options={options} data={data2} height={50} />
}
export default VerticalBarChart
