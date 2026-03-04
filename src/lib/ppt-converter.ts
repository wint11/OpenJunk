import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import util from 'util';

const execAsync = util.promisify(exec);

export async function convertPptToPdf(inputBuffer: Buffer): Promise<Buffer> {
    const tempDir = path.join(process.cwd(), 'temp_ppt_conversion');
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
    }

    const tempInputFile = path.join(tempDir, `input_${Date.now()}.pptx`);
    const tempOutputFile = path.join(tempDir, `output_${Date.now()}.pdf`);

    try {
        // Write buffer to temp file
        fs.writeFileSync(tempInputFile, inputBuffer);

        // Determine Python executable path
        let pythonPath = 'python'; // Default to global python
        const venvPath = path.join(process.cwd(), '.venv');
        
        if (process.platform === 'win32') {
            const venvPython = path.join(venvPath, 'Scripts', 'python.exe');
            if (fs.existsSync(venvPython)) {
                pythonPath = venvPython;
            }
        } else {
            const venvPython = path.join(venvPath, 'bin', 'python');
            if (fs.existsSync(venvPython)) {
                pythonPath = venvPython;
            }
        }

        // Call Python script to convert
        // Ensure 'python' or 'python3' is available in PATH and has aspose-slides installed
        // We use the script we just created
        const scriptPath = path.join(process.cwd(), 'scripts', 'ppt2pdf.py');
        
        // Escape paths for shell
        const command = `"${pythonPath}" "${scriptPath}" "${tempInputFile}" "${tempOutputFile}"`;
        
        console.log(`Executing conversion command: ${command}`);
        const { stdout, stderr } = await execAsync(command);
        
        if (stderr) {
            console.warn('Python script stderr:', stderr);
        }
        console.log('Python script stdout:', stdout);

        if (fs.existsSync(tempOutputFile)) {
            const pdfBuffer = fs.readFileSync(tempOutputFile);
            // Cleanup
            fs.unlinkSync(tempInputFile);
            fs.unlinkSync(tempOutputFile);
            return pdfBuffer;
        } else {
            throw new Error('Conversion failed: Output PDF not found');
        }

    } catch (err) {
        console.error('Error converting PPT to PDF:', err);
        // Cleanup on error
        if (fs.existsSync(tempInputFile)) fs.unlinkSync(tempInputFile);
        if (fs.existsSync(tempOutputFile)) fs.unlinkSync(tempOutputFile);
        
        throw new Error(`Failed to convert PPT to PDF: ${err}`);
    }
}

