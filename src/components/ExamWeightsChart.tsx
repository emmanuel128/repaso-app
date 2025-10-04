import React from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

const ExamWeightsChart: React.FC = () => {
  const data = {
    labels: [
      'Ética/Legal (15%)',
      'Evaluación (14%)',
      'Tratamiento (14%)',
      'Cognitivo-Afectivo (13%)',
      'Biológicas (12%)',
      'Social/Multicultural (12%)',
      'Desarrollo (12%)',
      'Investigación (8%)'
    ],
    datasets: [
      {
        label: 'Peso en el Examen',
        data: [15, 14, 14, 13, 12, 12, 12, 8],
        backgroundColor: [
          '#808670',
          '#A0AB89',
          '#BF8A64',
          '#BD612A',
          '#E89B40',
          '#E6B883',
          '#F0E1D1',
          '#d1d5db'
        ],
        borderColor: '#FFFFFF',
        borderWidth: 3,
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 15,
          color: '#808670'
        }
      },
      tooltip: {
        callbacks: {
          title: function(tooltipItems: any) {
            const item = tooltipItems[0];
            let label = item.chart.data.labels[item.dataIndex];
            if (Array.isArray(label)) {
              return label.join(' ');
            } else {
              return label;
            }
          }
        }
      }
    }
  };

  return (
    <section className="mb-16 bg-brand-bg p-6 rounded-xl shadow-lg border border-gray-100">
      <h2 className="text-2xl font-bold text-brand-main text-center mb-4">
        Distribución de Peso del Examen
      </h2>
      <p className="text-center text-sm text-brand-dark mb-4">
        Enfoca tu energía en las áreas de mayor peso. ¡Cada punto cuenta!
      </p>
      <div className="donut-container">
        <Doughnut data={data} options={options} />
      </div>
    </section>
  );
};

export default ExamWeightsChart;