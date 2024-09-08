# main.py
import io
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from PIL import Image
import torch
from RealESRGAN import RealESRGAN

app = FastAPI()

# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Allow your Next.js frontend origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load the Real-ESRGAN model
device = torch.device('cpu')
model = RealESRGAN(device, scale=4)
model.load_weights('weights/RealESRGAN_x4.pth', download=True)  # Ensure the path and download are correct

@app.post("/enhance")
async def enhance_image(file: UploadFile = File(...)):
    # Read the uploaded image
    contents = await file.read()
    img = Image.open(io.BytesIO(contents)).convert('RGB')
    
    # Enhance the image using RealESRGAN
    sr_image = model.predict(img)
    
    # Convert the output to a PNG image
    img_byte_arr = io.BytesIO()
    sr_image.save(img_byte_arr, format='PNG')
    img_byte_arr.seek(0)
    
    return StreamingResponse(img_byte_arr, media_type="image/png")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)
