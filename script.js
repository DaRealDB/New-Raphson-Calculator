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
    
    // Validate inputs
    if (!funcStr || !derivStr || isNaN(initialGuess) || isNaN(tolerance) || isNaN(maxIterations)) {
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
    
    try {
        // Test if the function and derivative can be evaluated
        const testFunc = new Function('x', 'return ' + funcStr + ';');
        const testDeriv = new Function('x', 'return ' + derivStr + ';');
        testFunc(0);
        testDeriv(0);
    } catch (e) {
        document.getElementById('error').textContent = 'Invalid function or derivative format. Please check your input.';
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
        
        const xn1 = xn - fxn / fpxn;
        error = Math.abs(xn1 - xn);
        
        iterationsData.push({
            xn: xn,
            fxn: fxn,
            fpxn: fpxn,
            error: error
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