 // Chart variable to hold our graph
 let functionChart = null;
        
 function calculate() {
     // Clear previous results and errors
     document.getElementById('error').textContent = '';
     document.getElementById('rootResult').textContent = '';
     document.getElementById('iterationsResult').textContent = '';
     document.getElementById('tableContainer').innerHTML = '';
     
     // Get input values
     const funcStr = document.getElementById('function').value;
     const derivStr = document.getElementById('derivative').value;
     const initialGuess = parseFloat(document.getElementById('initialGuess').value);
     const tolerance = parseFloat(document.getElementById('tolerance').value);
     const maxIterations = parseInt(document.getElementById('maxIterations').value);
     const xMin = parseFloat(document.getElementById('xMin').value);
     const xMax = parseFloat(document.getElementById('xMax').value);
     const yMin = parseFloat(document.getElementById('yMin').value);
     const yMax = parseFloat(document.getElementById('yMax').value);
     
     // Validate inputs
     if (!funcStr || !derivStr || isNaN(initialGuess) || isNaN(tolerance) || isNaN(maxIterations) || 
         isNaN(xMin) || isNaN(xMax) || isNaN(yMin) || isNaN(yMax)) {
         document.getElementById('error').textContent = 'Please fill in all fields with valid values.';
         return;
     }
     
     if (tolerance <= 0) {
         document.getElementById('error').textContent = 'Tolerance must be greater than 0.';
         return;
     }
     
     if (maxIterations <= 0) {
         document.getElementById('error').textContent = 'Maximum iterations must be greater than 0.';
         return;
     }
     
     if (xMin >= xMax) {
         document.getElementById('error').textContent = 'X Min must be less than X Max.';
         return;
     }
     
     if (yMin >= yMax) {
         document.getElementById('error').textContent = 'Y Min must be less than Y Max.';
         return;
     }
     
     try {
         // Test if the function and derivative can be evaluated
         const testFunc = new Function('x', 'return ' + funcStr + ';');
         const testDeriv = new Function('x', 'return ' + derivStr + ';');
         testFunc(0);
         testDeriv(0);
     } catch (e) {
         document.getElementById('error').textContent = 'Invalid function or derivative format. Please check your input. Error: ' + e.message;
         return;
     }
     
     // Perform Newton-Raphson calculation
     const results = newtonRaphson(funcStr, derivStr, initialGuess, tolerance, maxIterations);
     
     if (results.error) {
         document.getElementById('error').textContent = results.error;
         return;
     }
     
     // Display results
     document.getElementById('rootResult').innerHTML = `<p><strong>Approximate Root:</strong> ${results.root.toFixed(8)}</p>`;
     document.getElementById('iterationsResult').innerHTML = `<p><strong>Iterations:</strong> ${results.iterations}</p>`;
     
     // Create table with iteration details
     let tableHTML = `
         <table>
             <thead>
                 <tr>
                     <th>Iteration</th>
                     <th>xₙ</th>
                     <th>f(xₙ)</th>
                     <th>f'(xₙ)</th>
                     <th>Error</th>
                 </tr>
             </thead>
             <tbody>
     `;
     
     for (let i = 0; i < results.iterationsData.length; i++) {
         const iter = results.iterationsData[i];
         tableHTML += `
             <tr>
                 <td>${i}</td>
                 <td>${iter.xn.toFixed(8)}</td>
                 <td>${iter.fxn.toFixed(8)}</td>
                 <td>${iter.fpxn.toFixed(8)}</td>
                 <td>${iter.error ? iter.error.toFixed(8) : '-'}</td>
             </tr>
         `;
     }
     
     tableHTML += `
             </tbody>
         </table>
     `;
     
     document.getElementById('tableContainer').innerHTML = tableHTML;
     
     // Draw the graph
     drawGraph(funcStr, derivStr, results.iterationsData, xMin, xMax, yMin, yMax);
 }
 
 function newtonRaphson(funcStr, derivStr, initialGuess, tolerance, maxIterations) {
     const func = new Function('x', 'return ' + funcStr + ';');
     const deriv = new Function('x', 'return ' + derivStr + ';');
     
     let xn = initialGuess;
     let iterations = 0;
     let iterationsData = [];
     let error = null;
     
     for (let i = 0; i < maxIterations; i++) {
         const fxn = func(xn);
         const fpxn = deriv(xn);
         
         // Check if derivative is zero to avoid division by zero
         if (Math.abs(fpxn) < 1e-10) {
             return {
                 error: "Derivative is zero. Cannot continue calculation."
             };
         }
         
         const xn1 = xn - (fxn / fpxn);
         error = Math.abs(xn1 - xn);
         
         iterationsData.push({
             xn: xn,
             fxn: fxn,
             fpxn: fpxn,
             error: error,
             tangentSlope: fpxn,
             tangentIntercept: fxn - fpxn * xn
         });
         
         if (error < tolerance) {
             iterations = i + 1;
             return {
                 root: xn1,
                 iterations: iterations,
                 iterationsData: iterationsData,
                 error: null
             };
         }
         
         xn = xn1;
     }
     
     return {
         error: "Maximum iterations reached without convergence.",
         root: xn,
         iterations: maxIterations,
         iterationsData: iterationsData
     };
 }
 
 function drawGraph(funcStr, derivStr, iterationsData, xMin, xMax, yMin, yMax) {
     const func = new Function('x', 'return ' + funcStr + ';');
     const ctx = document.getElementById('functionChart').getContext('2d');
     
     // Destroy previous chart if it exists
     if (functionChart) {
         functionChart.destroy();
     }
     
     // Generate data points for the function
     const step = (xMax - xMin) / 100;
     const labels = [];
     const functionData = [];
     
     for (let x = xMin; x <= xMax; x += step) {
         labels.push(x.toFixed(2));
         try {
             functionData.push(func(x));
         } catch (e) {
             functionData.push(null); // For points where function might be undefined
         }
     }
     
     // Create datasets for the chart
     const datasets = [
         {
             label: 'f(x)',
             data: functionData,
             borderColor: 'rgb(75, 192, 192)',
             backgroundColor: 'rgba(75, 192, 192, 0.1)',
             borderWidth: 2,
             fill: false,
             tension: 0.1
         },
         {
             label: 'y = 0',
             data: Array(labels.length).fill(0),
             borderColor: 'rgb(169, 169, 169)',
             borderWidth: 1,
             borderDash: [5, 5],
             pointRadius: 0
         }
     ];
     
     // Add tangent lines for each iteration point
     iterationsData.forEach((iter, index) => {
         const tangentData = labels.map(x => {
             const xVal = parseFloat(x);
             return iter.tangentSlope * xVal + iter.tangentIntercept;
         });
         
         datasets.push({
             label: `Tangent ${index}`,
             data: tangentData,
             borderColor: `hsl(${(index * 30) % 360}, 70%, 50%)`,
             borderWidth: 1,
             pointRadius: 0,
             borderDash: [3, 3]
         });
         
         // Add point for the iteration
         datasets.push({
             label: `Iteration ${index}`,
             data: Array(labels.length).fill(null),
             pointBackgroundColor: `hsl(${(index * 30) % 360}, 70%, 50%)`,
             pointRadius: 5,
             pointHoverRadius: 7,
             showLine: false,
             data: [{x: iter.xn, y: iter.fxn}]
         });
     });
     
     // Create the chart
     functionChart = new Chart(ctx, {
         type: 'line',
         data: {
             labels: labels,
             datasets: datasets
         },
         options: {
             responsive: true,
             maintainAspectRatio: false,
             scales: {
                 x: {
                     type: 'linear',
                     position: 'center',
                     min: xMin,
                     max: xMax,
                     title: {
                         display: true,
                         text: 'x'
                     }
                 },
                 y: {
                     min: yMin,
                     max: yMax,
                     title: {
                         display: true,
                         text: 'f(x)'
                     }
                 }
             },
             plugins: {
                 tooltip: {
                     callbacks: {
                         label: function(context) {
                             let label = context.dataset.label || '';
                             if (label) {
                                 label += ': ';
                             }
                             if (context.parsed.y !== null) {
                                 label += `(${context.parsed.x.toFixed(2)}, ${context.parsed.y.toFixed(2)})`;
                             }
                             return label;
                         }
                     }
                 },
                 legend: {
                     position: 'top',
                     onClick: (e, legendItem, legend) => {
                         // Default click behavior for all datasets except iteration points
                         const index = legendItem.datasetIndex;
                         const ci = legend.chart;
                         const meta = ci.getDatasetMeta(index);
                         
                         if (legendItem.text.includes('Iteration')) {
                             // For iteration points, do nothing (keep them always visible)
                             return;
                         }
                         
                         // For other datasets, toggle visibility
                         meta.hidden = meta.hidden === null ? !ci.data.datasets[index].hidden : null;
                         ci.update();
                     }
                 }
             }
         }
     });
 }