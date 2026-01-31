import CryptoJS from "crypto-js";
import React, { useState, useEffect } from "react";

import { jsPDF } from "jspdf";
import {
  DndContext,
  closestCenter
} from "@dnd-kit/core";

import {
  SortableContext,
  arrayMove,
  useSortable
} from "@dnd-kit/sortable";

import { CSS } from "@dnd-kit/utilities";
//function SortableItem({ id, url, name, onDelete }) {
  function SortableItem({ id, url, name, onDelete }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  };

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        width: "140px",
        border: "1px solid #ddd",
        padding: "6px",
        borderRadius: "8px",
        background: "#f9f9f9",
        position: "relative"
      }}
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        style={{ cursor: "grab" }}
      >
        <img
          src={url}
          style={{
            width: "100%",
            height: "100px",
            objectFit: "cover",
            borderRadius: "6px"
          }}
        />
      </div>

      {/* Delete button */}
      <button
        onClick={() => onDelete(id)}
        style={{
          position: "absolute",
          top: "5px",
          right: "5px",
          border: "none",
          background: "red",
          color: "white",
          borderRadius: "50%",
          width: "22px",
          height: "22px",
          cursor: "pointer",
          zIndex: 10
        }}
      >
        ×
      </button>

      {/* File name */}
      <div
        style={{
          fontSize: "11px",
          marginTop: "6px",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis"
        }}
        title={name}
      >
        {name}
      </div>
    </div>
  );
}




function App() {
  const [licensed, setLicensed] = useState(false);
const [licenseInput, setLicenseInput] = useState("");
const SECRET = "MY_SECRET_123";


   const [images, setImages] = useState([]);
const [pdfName, setPdfName] = useState("deepakpdfgen");

const [loading, setLoading] = useState(false);

 const deleteImage = (id) => {
  setImages(images.filter(img => img.id !== id));
};

const wait = () => new Promise(resolve => setTimeout(resolve, 0));

const clearAll = () => {
  images.forEach(img => URL.revokeObjectURL(img.url)); 
  setImages([]);
};

 const uploadImages = (e) => {
  const files = Array.from(e.target.files);

  const imageFiles = files.filter(file => file.type.startsWith("image/"));

  if (imageFiles.length !== files.length) {
    alert("Only image files are allowed");
  }

  const newImages = imageFiles.map((file) => ({
    id: crypto.randomUUID(),
    file,
    name: file.name,
    url: URL.createObjectURL(file)
  }));

  setImages((prev) => [...prev, ...newImages]);
};


const validateLicense = () => {
  try {
    const bytes = CryptoJS.AES.decrypt(licenseInput, SECRET);
    const data = bytes.toString(CryptoJS.enc.Utf8);
    const [user, expiry] = data.split("|");

    if (!user || !expiry) return alert("Invalid license");

    if (new Date(expiry) < new Date()) {
      alert("License expired");
      return;
    }

    localStorage.setItem("license", licenseInput);
    setLicensed(true);
  } catch {
    alert("Invalid license");
  }
};

useEffect(() => {
  const saved = localStorage.getItem("license");
  if (!saved) return;

  try {
    const bytes = CryptoJS.AES.decrypt(saved, SECRET);
    const data = bytes.toString(CryptoJS.enc.Utf8);
    const [user, expiry] = data.split("|");

    if (new Date(expiry) > new Date()) setLicensed(true);
  } catch {}
}, []);
if (!licensed) {
  return (
    <div style={{ padding: 40, textAlign: "center" }}>
      <h2>Enter License Key</h2>
      <input
        value={licenseInput}
        onChange={(e) => setLicenseInput(e.target.value)}
        style={{ padding: "10px", width: "300px" }}
      />
      <br /><br />
      <button
        onClick={validateLicense}
        style={{
          padding: "10px 20px",
          background: "#0e7ed3",
          color: "#fff",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer"
        }}
      >
        Activate
      </button>
    </div>
  );
}


const handleDragEnd = (event) => {
  const { active, over } = event;
  if (!over || active.id === over.id) return;

  setImages((items) => {
    const oldIndex = items.findIndex(i => i.id === active.id);
    const newIndex = items.findIndex(i => i.id === over.id);
    return arrayMove(items, oldIndex, newIndex);
  });
};


  // const createPDF = async () => {
  //   if (images.length === 0) {
  //     alert("Please select images");
  //     return;
  //   }

  //   const pdf = new jsPDF();

  //   for (let i = 0; i < images.length; i++) {
  //     const img = await loadImage(images[i].url);
  //     const width = pdf.internal.pageSize.getWidth();
  //     const height = (img.height * width) / img.width;

  //     if (i > 0) pdf.addPage();
  //     pdf.addImage(img, "JPEG", 0, 0, width, height);
  //   }

  //   pdf.save("images.pdf");
  // };
const compressImage = (img) => {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");

    
    canvas.width = img.width;
    canvas.height = img.height;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);

    canvas.toBlob(
      (blob) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      },
      "image/jpeg",
      0.7   
    );
  });
};


const createPDF = async () => {
  if (images.length === 0) {
    alert("Select images");
    return;
  }

  setLoading(true);

  let pdf = null;

  for (let i = 0; i < images.length; i++) {
    const original = await loadImage(images[i].url);
    const compressed = await compressImage(original);
    const img = await loadImage(compressed);

    const w = img.width;
    const h = img.height;

    if (i === 0) {
     pdf = new jsPDF({
  unit: "px",
  format: [w, h],
  orientation: w > h ? "l" : "p",
  hotfixes: ["px_scaling"]
});

    } else {
      pdf.addPage([w, h], w > h ? "l" : "p", true);
    }

    pdf.addImage(compressed, "JPEG", 0, 0, w, h);

    
    original.src = "";
    img.src = "";

    await wait(); 
  }

  const fileName = pdfName.trim() || "deepakpdfgen";
pdf.save(fileName + ".pdf");

  setLoading(false);
};



  const loadImage = (src) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = src;
      img.onload = () => resolve(img);
    });
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Image to PDF Converter</h2>

      <input type="file" multiple accept="image/*" onChange={uploadImages} />
      <div style={{ marginTop: 10, fontSize: "14px", color: "#555" }}>
  Total Images: <b>{images.length}</b>
</div>


    <DndContext
  collisionDetection={closestCenter}
  onDragEnd={handleDragEnd}
>
  <SortableContext items={images.map(i => i.id)}>

    <div
      style={{
        marginTop: 20,
        display: "flex",
        flexWrap: "wrap",
        gap: "15px"
      }}
    >
     {images.map((img) => (
  <SortableItem
    key={img.id}
    id={img.id}
    url={img.url}
    name={img.name}
    onDelete={deleteImage}
  />
))}

    </div>
  </SortableContext>
</DndContext>


<div style={{ marginTop: 20 }}>
  <label style={{ display: "block", marginBottom: 5 }}>
    PDF File Name:
  </label>
  <input
    type="text"
    value={pdfName}
    onChange={(e) => setPdfName(e.target.value)}
    placeholder="Enter file name"
    style={{
      padding: "8px",
      width: "250px",
      border: "1px solid #ccc",
      borderRadius: "4px"
    }}
  />
</div>


    <button
  onClick={createPDF}
  disabled={loading}
  style={{
    marginTop: 20,
    padding: "10px 20px",
    fontSize: "16px",
    cursor: loading ? "not-allowed" : "pointer",
    background: loading ? "#ccc" : "#0e7ed3ff",
    color: "#fff",
    border: "none",
    borderRadius: "5px"
  }}
>
  {loading ? "Generating PDF..." : "Convert to PDF"}
</button>
 <button
    onClick={clearAll}
    disabled={loading || images.length === 0}
    style={{
      padding: "10px 20px",
      fontSize: "16px",
      background: "#f44336",
      color: "#fff",
      border: "none",
      marginLeft:"10px",
      marginBottom:"25px",
      borderRadius: "5px",
      cursor: loading || images.length === 0 ? "not-allowed" : "pointer"
    }}
  >
    Clear
  </button>
    </div>
  );
}

export default App;
