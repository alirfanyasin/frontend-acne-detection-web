import React, { useState, useEffect, useCallback, useRef } from "react";
import Webcam from "react-webcam";

function App() {
  const webcamRef = useRef(null);
  const [imgSrc, setImgSrc] = useState(null);
  const [processedImg, setProcessedImg] = useState(null);
  const [loading, setLoading] = useState(false);
  const [devices, setDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState(null);
  const [jerawatAnalysis, setJerawatAnalysis] = useState(null);

  // Handle device camera selection
  const handleDevices = useCallback(
    (mediaDevices) => {
      const videoDevices = mediaDevices.filter(
        ({ kind }) => kind === "videoinput"
      );
      setDevices(videoDevices);
      if (!selectedDeviceId && videoDevices.length > 0) {
        setSelectedDeviceId(videoDevices[0].deviceId);
      }
    },
    [selectedDeviceId]
  );

  useEffect(() => {
    navigator.mediaDevices.enumerateDevices().then(handleDevices);
  }, [handleDevices]);

  // Capture image from webcam
  const capture = useCallback(() => {
    const imageSrc = webcamRef.current.getScreenshot();
    setImgSrc(imageSrc);
    sendToBackend(imageSrc, false);
  }, [webcamRef]);

  // Upload image from file
  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImgSrc(URL.createObjectURL(file));
      sendToBackend(file, true);
    }
  };

  // Send image to backend
  const sendToBackend = async (imageInput, fromUpload = false) => {
    setLoading(true);
    const formData = new FormData();

    if (fromUpload) {
      formData.append("image", imageInput);
    } else {
      const blob = await fetch(imageInput).then((res) => res.blob());
      formData.append("image", blob, "capture.jpg");
    }

    try {
      const response = await fetch(
        "https://api-acne-detection-model.vercel.app/predict",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();
      setProcessedImg(data.image_url);
      setJerawatAnalysis(data);
    } catch (error) {
      console.error("Error sending image to backend:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="w-10/12 mx-auto mt-5 font-sans">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Webcam & Upload */}
        <div className="md:col-span-2 border p-4 rounded-xl relative bg-slate-200 mb-10">
          {/* Dropdown to Select Camera */}
          <div className="mb-4">
            <label className="block font-semibold mb-1">Pilih Kamera:</label>
            <select
              className="border rounded px-3 py-1 bg-white w-full"
              onChange={(e) => setSelectedDeviceId(e.target.value)}
              value={selectedDeviceId || ""}
            >
              {devices.map((device, index) => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label || `Kamera ${index + 1}`}
                </option>
              ))}
            </select>
          </div>

          {/* Webcam */}
          <div className="vh-100 flex items-center justify-center overflow-hidden rounded-lg">
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              mirrored={true}
              videoConstraints={{
                deviceId: selectedDeviceId
                  ? { exact: selectedDeviceId }
                  : undefined,
              }}
              className="w-full rounded-lg"
            />
          </div>

          <div className="flex justify-center mt-4 gap-4">
            <button
              onClick={capture}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Ambil Gambar
            </button>
            <input
              type="file"
              accept="image/*"
              onChange={handleUpload}
              className="file:bg-white file:border file:border-gray-300 file:rounded-md file:px-4 file:py-2 text-sm"
            />
          </div>
        </div>

        {/* Hasil Deteksi */}
        <div className="border p-4 rounded-xl bg-white shadow-sm mb-10">
          <h2 className="text-xl font-semibold mb-3">Hasil Deteksi</h2>
          <div className="overflow-hidden rounded-lg">
            {loading ? (
              <p className="text-blue-600 text-center">Memproses gambar...</p>
            ) : processedImg ? (
              <img src={processedImg} alt="Hasil Deteksi" className="w-full" />
            ) : (
              <p className="text-gray-500 text-center">Belum ada gambar.</p>
            )}
          </div>
          <hr className="mt-5" />

          {jerawatAnalysis && (
            <div className="mt-4">
              <h3 className="text-xl font-bold text-center mb-4">
                Analisa Jerawat
              </h3>
              <hr className="mt-5" />

              <p>
                <strong>Jumlah Jerawat:</strong>{" "}
                {jerawatAnalysis.jumlah_jerawat}
              </p>
              <p>
                <strong>Tingkat Keparahan:</strong>{" "}
                {jerawatAnalysis.tingkat_keparahan}
              </p>
              <p>
                <strong>Analisa:</strong> {jerawatAnalysis.analisa}
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

export default App;
