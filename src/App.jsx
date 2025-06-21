import { useEffect, useRef, useState } from "react";
import { Palette, Brush, Eraser, RotateCcw, Download, Upload, Square, Circle, Minus, Type, Undo, Redo, Trash2, Sun, Moon } from "lucide-react";
import "./App.css";
function App() {
    const canvasRef = useRef(null);
    const ctxRef = useRef(null);
    const fileInputRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [lineWidth, setLineWidth] = useState(5);
    const [lineColor, setLineColor] = useState("#000000");
    const [lineOpacity, setLineOpacity] = useState(1);
    const [tool, setTool] = useState("brush");
    const [history, setHistory] = useState([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [startPos, setStartPos] = useState({ x: 0, y: 0 });
    const [isShapeDrawing, setIsShapeDrawing] = useState(false);

    const colors = [
        "#000000", "#FFFFFF", "#FF0000", "#00FF00", "#0000FF", "#FFFF00",
        "#FF00FF", "#00FFFF", "#FFA500", "#800080", "#FFC0CB", "#A52A2A",
        "#808080", "#90EE90", "#87CEEB", "#DDA0DD", "#F0E68C", "#E6E6FA"
    ];

    // Initialize canvas
    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        
        // Set canvas size to match display size
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
        
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.globalAlpha = lineOpacity;
        ctx.strokeStyle = lineColor;
        ctx.lineWidth = lineWidth;
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctxRef.current = ctx;
        saveToHistory();
    }, []);

    // Update canvas properties when settings change
    useEffect(() => {
        if (ctxRef.current) {
            ctxRef.current.globalAlpha = lineOpacity;
            ctxRef.current.strokeStyle = lineColor;
            ctxRef.current.lineWidth = lineWidth;
        }
    }, [lineColor, lineOpacity, lineWidth]);

    // Save canvas state to history
    const saveToHistory = () => {
        const canvas = canvasRef.current;
        const dataURL = canvas.toDataURL();
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(dataURL);
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
    };

    // Undo function
    const undo = () => {
        if (historyIndex > 0) {
            const newIndex = historyIndex - 1;
            setHistoryIndex(newIndex);
            restoreFromHistory(history[newIndex]);
        }
    };

    // Redo function
    const redo = () => {
        if (historyIndex < history.length - 1) {
            const newIndex = historyIndex + 1;
            setHistoryIndex(newIndex);
            restoreFromHistory(history[newIndex]);
        }
    };

    // Restore canvas from history
    const restoreFromHistory = (dataURL) => {
        const canvas = canvasRef.current;
        const ctx = ctxRef.current;
        const img = new Image();
        img.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
        };
        img.src = dataURL;
    };

    // Get mouse position relative to canvas
    const getMousePos = (e) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    };

    // Start drawing
    const startDrawing = (e) => {
        const pos = getMousePos(e);
        
        if (tool === "rectangle" || tool === "circle") {
            setStartPos(pos);
            setIsShapeDrawing(true);
            return;
        }

        ctxRef.current.beginPath();
        ctxRef.current.moveTo(pos.x, pos.y);
        setIsDrawing(true);
    };

    // End drawing
    const endDrawing = () => {
        if (isShapeDrawing) {
            setIsShapeDrawing(false);
            saveToHistory();
        } else if (isDrawing) {
            ctxRef.current.closePath();
            setIsDrawing(false);
            saveToHistory();
        }
    };

    // Draw function
    const draw = (e) => {
        const pos = getMousePos(e);

        if (isShapeDrawing) {
            // Preview shape while drawing
            const canvas = canvasRef.current;
            const ctx = ctxRef.current;
            
            // Restore canvas to state before shape preview
            if (historyIndex >= 0) {
                restoreFromHistory(history[historyIndex]);
            }
            
            // Draw shape preview
            ctx.beginPath();
            if (tool === "rectangle") {
                const width = pos.x - startPos.x;
                const height = pos.y - startPos.y;
                ctx.rect(startPos.x, startPos.y, width, height);
            } else if (tool === "circle") {
                const radius = Math.sqrt(Math.pow(pos.x - startPos.x, 2) + Math.pow(pos.y - startPos.y, 2));
                ctx.arc(startPos.x, startPos.y, radius, 0, 2 * Math.PI);
            }
            ctx.stroke();
            return;
        }

        if (!isDrawing) return;

        if (tool === "eraser") {
            ctxRef.current.globalCompositeOperation = "destination-out";
            ctxRef.current.arc(pos.x, pos.y, lineWidth, 0, Math.PI * 2);
            ctxRef.current.fill();
        } else {
            ctxRef.current.globalCompositeOperation = "source-over";
            ctxRef.current.lineTo(pos.x, pos.y);
            ctxRef.current.stroke();
        }
    };

    // Clear canvas
    const clearCanvas = () => {
        const canvas = canvasRef.current;
        const ctx = ctxRef.current;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        saveToHistory();
    };

    // Download canvas as image
    const downloadImage = () => {
        const canvas = canvasRef.current;
        const link = document.createElement("a");
        link.download = "artwork.png";
        link.href = canvas.toDataURL();
        link.click();
    };

    // Upload image to canvas
    const uploadImage = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = canvasRef.current;
                    const ctx = ctxRef.current;
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    saveToHistory();
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className={`app ${isDarkMode ? 'dark' : ''}`}>
            <header className="app-header">
                <div className="app-title">
                    <Palette className="title-icon" />
                    <h1>Digital Canvas</h1>
                </div>
                <button 
                    className="theme-toggle"
                    onClick={() => setIsDarkMode(!isDarkMode)}
                >
                    {isDarkMode ? <Sun /> : <Moon />}
                </button>
            </header>

            <div className="app-content">
                <div className="toolbar">
                    {/* Tools */}
                    <div className="tool-section">
                        <h3>Tools</h3>
                        <div className="tool-grid">
                            <button 
                                className={`tool-btn ${tool === 'brush' ? 'active' : ''}`}
                                onClick={() => setTool('brush')}
                                title="Brush"
                            >
                                <Brush />
                            </button>
                            <button 
                                className={`tool-btn ${tool === 'eraser' ? 'active' : ''}`}
                                onClick={() => setTool('eraser')}
                                title="Eraser"
                            >
                                <Eraser />
                            </button>
                            <button 
                                className={`tool-btn ${tool === 'line' ? 'active' : ''}`}
                                onClick={() => setTool('line')}
                                title="Line"
                            >
                                <Minus />
                            </button>
                            <button 
                                className={`tool-btn ${tool === 'rectangle' ? 'active' : ''}`}
                                onClick={() => setTool('rectangle')}
                                title="Rectangle"
                            >
                                <Square />
                            </button>
                            <button 
                                className={`tool-btn ${tool === 'circle' ? 'active' : ''}`}
                                onClick={() => setTool('circle')}
                                title="Circle"
                            >
                                <Circle />
                            </button>
                        </div>
                    </div>

                    {/* Colors */}
                    <div className="tool-section">
                        <h3>Colors</h3>
                        <div className="color-grid">
                            {colors.map((color) => (
                                <button
                                    key={color}
                                    className={`color-btn ${lineColor === color ? 'active' : ''}`}
                                    style={{ backgroundColor: color }}
                                    onClick={() => setLineColor(color)}
                                />
                            ))}
                        </div>
                        <input
                            type="color"
                            value={lineColor}
                            onChange={(e) => setLineColor(e.target.value)}
                            className="custom-color"
                        />
                    </div>

                    {/* Settings */}
                    <div className="tool-section">
                        <h3>Settings</h3>
                        <div className="setting">
                            <label>Brush Size: {lineWidth}px</label>
                            <input
                                type="range"
                                min="1"
                                max="50"
                                value={lineWidth}
                                onChange={(e) => setLineWidth(e.target.value)}
                                className="slider"
                            />
                        </div>
                        <div className="setting">
                            <label>Opacity: {Math.round(lineOpacity * 100)}%</label>
                            <input
                                type="range"
                                min="0.1"
                                max="1"
                                step="0.1"
                                value={lineOpacity}
                                onChange={(e) => setLineOpacity(e.target.value)}
                                className="slider"
                            />
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="tool-section">
                        <h3>Actions</h3>
                        <div className="action-grid">
                            <button 
                                className="action-btn"
                                onClick={undo}
                                disabled={historyIndex <= 0}
                                title="Undo"
                            >
                                <Undo />
                            </button>
                            <button 
                                className="action-btn"
                                onClick={redo}
                                disabled={historyIndex >= history.length - 1}
                                title="Redo"
                            >
                                <Redo />
                            </button>
                            <button 
                                className="action-btn"
                                onClick={clearCanvas}
                                title="Clear Canvas"
                            >
                                <Trash2 />
                            </button>
                            <button 
                                className="action-btn"
                                onClick={downloadImage}
                                title="Download"
                            >
                                <Download />
                            </button>
                            <button 
                                className="action-btn"
                                onClick={() => fileInputRef.current.click()}
                                title="Upload Image"
                            >
                                <Upload />
                            </button>
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={uploadImage}
                            accept="image/*"
                            style={{ display: 'none' }}
                        />
                    </div>
                </div>

                <div className="canvas-container">
                    <canvas
                        ref={canvasRef}
                        onMouseDown={startDrawing}
                        onMouseUp={endDrawing}
                        onMouseMove={draw}
                        onMouseLeave={endDrawing}
                        className="drawing-canvas"
                    />
                </div>
            </div>
        </div>
    );
}

export default App;