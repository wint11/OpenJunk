import sys
import os
import comtypes.client

def convert_ppt_to_pdf(input_file, output_file):
    powerpoint = None
    presentation = None
    is_new_instance = False
    
    try:
        # Check if file exists
        if not os.path.exists(input_file):
            print(f"Error: Input file not found: {input_file}")
            sys.exit(1)

        input_file = os.path.abspath(input_file)
        output_file = os.path.abspath(output_file)

        # Try to get running instance first
        try:
            powerpoint = comtypes.client.GetActiveObject("Powerpoint.Application")
            print("Using existing PowerPoint instance")
        except:
            # If not running, create new instance
            powerpoint = comtypes.client.CreateObject("Powerpoint.Application")
            is_new_instance = True
            print("Created new PowerPoint instance")
        
        # Open the presentation
        # Force visible window as last resort to ensure it works
        try:
            # Try 1: Stealth mode
            presentation = powerpoint.Presentations.Open(input_file, WithWindow=False, ReadOnly=True)
        except Exception as e1:
            print(f"Attempt 1 failed: {e1}")
            try:
                # Try 2: Normal mode (ReadOnly)
                presentation = powerpoint.Presentations.Open(input_file, ReadOnly=True)
            except Exception as e2:
                print(f"Attempt 2 failed: {e2}")
                # Try 3: Force Visible + Normal Open
                # Sometimes PowerPoint needs to be visible to open files from "untrusted" locations
                if powerpoint:
                    powerpoint.Visible = 1
                presentation = powerpoint.Presentations.Open(input_file)

        # Save as PDF (format 32)
        presentation.SaveAs(output_file, 32)
        
        print(f"Successfully converted {input_file} to {output_file}")
        
    except Exception as e:
        print(f"Error converting PPT to PDF via COM: {str(e)}")
        # If we failed, we should still try to close what we opened
        # Explicitly exit with error code 1
        sys.exit(1)
    finally:
        if presentation:
            try:
                presentation.Close()
            except:
                pass
        
        # Only quit if we created a new instance
        if powerpoint and is_new_instance:
            try:
                powerpoint.Quit()
            except:
                pass

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python ppt2pdf.py <input_ppt_file> <output_pdf_file>")
        sys.exit(1)
        
    input_path = sys.argv[1]
    output_path = sys.argv[2]
    
    convert_ppt_to_pdf(input_path, output_path)
