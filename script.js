let chart = null;
let map = null;

// Country coordinates object (previous implementation remains the same)
const COUNTRY_COORDINATES = {
    "Lebanon": [33.854721, 35.862285],
    "France": [46.227638, 2.213749],
    "Japan": [36.204824, 138.252924]
    // ... rest of coordinates
};

function processData() {
    const input = document.getElementById('dataInput').value;
    const lines = input.trim().split('\n');
    
    const data = {
        labels: [],
        percentages: [],
        standardErrors: [],
        pValue: null,
        chiSquare: null,
        locations: [],
        rightPopulations: []
    };

    let isRightPopSection = false;

    lines.forEach(line => {
        if (line.toLowerCase().includes('right populations:')) {
            isRightPopSection = true;
            return;
        }

        if (line.includes('p-value')) {
            data.pValue = parseFloat(line.split(':')[1].trim());
            isRightPopSection = false;
        }
        else if (line.includes('chisq')) {
            data.chiSquare = parseFloat(line.split(':')[1].trim());
            isRightPopSection = false;
        }
        else if (line.includes('%')) {
            const parts = line.trim().split(/\s+/);
            data.labels.push(parts[0]);
            data.percentages.push(parseFloat(parts[1].replace('%', '')));
            data.standardErrors.push(parseFloat(parts[2]));
            data.locations.push(parts[3] || "");
        }
        else if (isRightPopSection && line.trim()) {
            data.rightPopulations.push(line.trim());
        }
    });

    // Update stats display
    const rightPopHtml = `<div class="mt-2"><strong>Right Populations:</strong><br>${data.rightPopulations.join('<br>') || '(None specified)'}</div>`;
    
    document.getElementById('statsDisplay').innerHTML = `
        <h3 class="font-medium text-gray-700 mb-2">Statistics</h3>
        <div class="text-sm text-gray-600">p-value: ${data.pValue?.toFixed(4) || 'N/A'}</div>
        <div class="text-sm text-gray-600">Chi-square: ${data.chiSquare?.toFixed(4) || 'N/A'}</div>
        ${rightPopHtml}
    `;

    const visualizationType = document.getElementById('visualizationType').value;

    if (visualizationType === 'pie') {
        document.getElementById('map').style.display = 'none';
        document.getElementById('chartContainer').style.display = 'block';
        createChart(data);
    } else {
        document.getElementById('chartContainer').style.display = 'none';
        document.getElementById('map').style.display = 'block';
        setTimeout(() => createMap(data), 100);
    }
}

// Previous createChart and createMap functions remain the same

// Example data with empty Right Populations section
const exampleData = `Source1 45.5% 2.3 Lebanon
Source2 32.8% 1.9 France
Source3 21.7% 1.5 Japan
Right Populations:

p-value: 0.234
chisq: 1.456`;

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    const textarea = document.getElementById('dataInput');
    textarea.value = exampleData;
    document.getElementById('visualizationType').addEventListener('change', processData);
    processData();
});

// Previous createChart and createMap functions remain unchanged
function createChart(data) {
    if (chart) {
        chart.destroy();
    }

    const colors = data.labels.map(() => 
        `hsl(${Math.random() * 360}, 70%, 60%)`
    );

    const ctx = document.getElementById('pieChart').getContext('2d');
    chart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: data.labels,
            datasets: [{
                data: data.percentages,
                backgroundColor: colors,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const se = data.standardErrors[context.dataIndex];
                            return `${label}: ${value.toFixed(2)}% ± ${se.toFixed(2)}`;
                        }
                    }
                },
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20
                    }
                }
            }
        }
    });
}

function createMap(data) {
    if (map) {
        map.remove();
        map = null;
    }

    map = L.map('map').setView([20, 0], 2);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    data.labels.forEach((label, index) => {
        const percentage = data.percentages[index];
        const location = data.locations[index];
        const coordinates = COUNTRY_COORDINATES[location];
        
        if (coordinates) {
            const circle = L.circle(coordinates, {
                color: `hsl(${Math.random() * 360}, 70%, 60%)`,
                fillColor: `hsl(${Math.random() * 360}, 70%, 60%)`,
                fillOpacity: 0.5,
                radius: percentage * 10000
            }).addTo(map);

            circle.bindPopup(`
                <strong>${label}</strong><br>
                Percentage: ${percentage.toFixed(2)}%<br>
                Location: ${location}
            `);
        }
    });

    setTimeout(() => {
        map.invalidateSize();
    }, 200);
}
