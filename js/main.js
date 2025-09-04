document.addEventListener('DOMContentLoaded', function() {
    // DOM元素
    const dropArea = document.getElementById('dropArea');
    const browseBtn = document.getElementById('browseBtn');
    const fileInput = document.getElementById('fileInput');
    const convertBtn = document.getElementById('convertBtn');
    const downloadSelectedBtn = document.getElementById('downloadSelectedBtn');
    const downloadAllBtn = document.getElementById('downloadAllBtn');
    const clearAllBtn = document.getElementById('clearAllBtn');
    const selectAllBtn = document.getElementById('selectAllBtn');
    const previewBox = document.getElementById('previewBox');
    const outputFormat = document.getElementById('outputFormat');
    const qualitySlider = document.getElementById('quality');
    const qualityValue = document.getElementById('qualityValue');
    const originalInfo = document.getElementById('originalInfo');
    const convertedInfo = document.getElementById('convertedInfo');
    const progressBar = document.getElementById('progressBar');
    const progressStatus = document.getElementById('progressStatus');
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');
    const imageDimensions = document.getElementById('imageDimensions');
    const fileList = document.getElementById('fileList');
    const emptyListMessage = document.getElementById('emptyListMessage');
    const svgInfo = document.getElementById('svgInfo');
    
    // 存储图片数据
    let files = [];
    let currentRotation = 0;
    let flipHorizontal = false;
    let flipVertical = false;
    let currentPreviewIndex = -1;
    let currentDimensions = { width: 0, height: 0 };
    
    // 初始化标签页
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // 移除所有active类
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            // 添加active类到当前标签
            tab.classList.add('active');
            const tabId = tab.getAttribute('data-tab') + 'Tab';
            document.getElementById(tabId).classList.add('active');
        });
    });
    
    // 初始化滑块
    function initSliders() {
        // 质量滑块
        qualitySlider.addEventListener('input', function() {
            qualityValue.textContent = this.value + '%';
        });
        
        // 调整大小滑块
        const resizePercentage = document.getElementById('resizePercentage');
        const percentageValue = document.getElementById('percentageValue');
        resizePercentage.addEventListener('input', function() {
            percentageValue.textContent = this.value + '%';
        });
    }
    
    // SVG选项显示处理
    outputFormat.addEventListener('change', function() {
        const qualityControl = document.getElementById('qualityControl');
        if (this.value === 'svg') {
            qualityControl.classList.add('hidden');
            svgInfo.classList.remove('hidden');
        } else {
            qualityControl.classList.remove('hidden');
            svgInfo.classList.add('hidden');
        }
    });
    
    // 初始化调整大小设置
    function initResize() {
        const resizeMethod = document.getElementById('resizeMethod');
        const percentageControl = document.getElementById('percentageControl');
        const dimensionControl = document.getElementById('dimensionControl');
        const targetWidth = document.getElementById('targetWidth');
        const targetHeight = document.getElementById('targetHeight');
        const keepAspect = document.getElementById('keepAspect');
        
        // 设置尺寸输入框的初始值
        targetWidth.value = '';
        targetHeight.value = '';
        
        resizeMethod.addEventListener('change', function() {
            if (this.value === 'percentage') {
                percentageControl.classList.remove('hidden');
                dimensionControl.classList.add('hidden');
            } else if (this.value === 'dimension') {
                percentageControl.classList.add('hidden');
                dimensionControl.classList.remove('hidden');
                
                // 如果已经有图片尺寸，设置默认值
                if (currentDimensions.width && currentDimensions.height) {
                    targetWidth.value = currentDimensions.width;
                    targetHeight.value = currentDimensions.height;
                }
            }
        });
        
        // 当保持宽高比时，自动调整高度
        targetWidth.addEventListener('input', function() {
            if (keepAspect.checked && currentDimensions.width && currentDimensions.height) {
                const aspectRatio = currentDimensions.height / currentDimensions.width;
                targetHeight.value = Math.round(this.value * aspectRatio);
            }
        });
        
        // 当保持宽高比时，自动调整宽度
        targetHeight.addEventListener('input', function() {
            if (keepAspect.checked && currentDimensions.width && currentDimensions.height) {
                const aspectRatio = currentDimensions.width / currentDimensions.height;
                targetWidth.value = Math.round(this.value * aspectRatio);
            }
        });
    }
    
    // 初始化旋转和翻转按钮
    function initRotationButtons() {
        document.getElementById('rotateLeftBtn').addEventListener('click', () => rotateImage(-90));
        document.getElementById('rotateRightBtn').addEventListener('click', () => rotateImage(90));
        document.getElementById('flipHorizontalBtn').addEventListener('click', () => flipImage('horizontal'));
        document.getElementById('flipVerticalBtn').addEventListener('click', () => flipImage('vertical'));
    }
    
    // 旋转图片
    function rotateImage(degrees) {
        if (files.length === 0) return;
        
        currentRotation += degrees;
        
        // 更新当前预览图片
        if (currentPreviewIndex >= 0) {
            updatePreview(currentPreviewIndex);
        }
    }
    
    // 翻转图片
    function flipImage(direction) {
        if (files.length === 0) return;
        
        if (direction === 'horizontal') {
            flipHorizontal = !flipHorizontal;
        } else {
            flipVertical = !flipVertical;
        }
        
        // 更新当前预览图片
        if (currentPreviewIndex >= 0) {
            updatePreview(currentPreviewIndex);
        }
    }
    
    // 更新质量显示
    qualitySlider.addEventListener('input', function() {
        qualityValue.textContent = this.value + '%';
    });
    
    // 文件选择处理
    browseBtn.addEventListener('click', function() {
        fileInput.click();
    });
    
    fileInput.addEventListener('change', handleFileSelect);
    
    // 拖放功能
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, preventDefaults, false);
    });
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    ['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, unhighlight, false);
    });
    
    function highlight() {
        dropArea.classList.add('dragover');
    }
    
    function unhighlight() {
        dropArea.classList.remove('dragover');
    }
    
    dropArea.addEventListener('drop', handleDrop, false);
    
    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFiles(files);
    }
    
    function handleFileSelect(e) {
        const fileList = e.target.files;
        handleFiles(fileList);
    }
    
    function handleFiles(fileList) {
        if (fileList.length === 0) return;
        
        // 检查文件大小 (10MB限制)
        for (let i = 0; i < fileList.length; i++) {
            const file = fileList[i];
            if (!file.type.match('image.*')) {
                alert('请选择图片文件！');
                return;
            }
            
            if (file.size > 10 * 1024 * 1024) {
                alert(`文件 ${file.name} 大小超过10MB限制！`);
                return;
            }
        }
        
        // 添加文件到列表
        for (let i = 0; i < fileList.length; i++) {
            const file = fileList[i];
            
            // 检查是否已存在同名文件
            if (files.some(f => f.name === file.name)) {
                continue;
            }
            
            const reader = new FileReader();
            reader.onload = function(e) {
                const img = new Image();
                img.src = e.target.result;
                
                img.onload = function() {
                    files.push({
                        name: file.name,
                        type: file.type.split('/')[1].toLowerCase(),
                        size: file.size,
                        data: e.target.result,
                        convertedData: null,
                        convertedType: '',
                        status: 'pending',
                        width: img.width,
                        height: img.height,
                        selected: true
                    });
                    
                    // 更新文件列表显示
                    updateFileList();
                    
                    // 默认预览第一个文件
                    if (files.length === 1) {
                        previewFile(0);
                    }
                };
            };
            reader.readAsDataURL(file);
        }
    }
    
    // 更新文件列表显示
    function updateFileList() {
        fileList.innerHTML = '';
        
        if (files.length === 0) {
            fileList.appendChild(emptyListMessage);
            emptyListMessage.classList.remove('hidden');
            return;
        }
        
        emptyListMessage.classList.add('hidden');
        
        files.forEach((file, index) => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            fileItem.innerHTML = `
                <div class="file-icon">
                    
                </div>
                <div class="file-info">
                    <div class="file-name">
                        ${file.name} 
                        <input type="checkbox" class="file-checkbox" data-index="${index}" ${file.selected ? 'checked' : ''}>
                    </div>
                    <div class="file-size">${formatFileSize(file.size)}</div>
                    <div class="file-status">
                        <span class="status-icon status-${file.status}"></span>
                        ${getStatusText(file.status)}
                    </div>
                </div>
                <div class="file-actions">
    <button class="file-action-btn" data-action="preview" data-index="${index}" title="预览">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
        </svg>
    </button>
    <button class="file-action-btn" data-action="download" data-index="${index}" title="下载" ${file.convertedData ? '' : 'disabled'}>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
        </svg>
    </button>
    <button class="file-action-btn" data-action="remove" data-index="${index}" title="移除">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
    </button>
</div>

            `;
            fileList.appendChild(fileItem);
        });
        
        // 添加事件监听
        document.querySelectorAll('[data-action="preview"]').forEach(btn => {
            btn.addEventListener('click', function() {
                const index = parseInt(this.getAttribute('data-index'));
                previewFile(index);
            });
        });
        
        document.querySelectorAll('[data-action="download"]').forEach(btn => {
            btn.addEventListener('click', function() {
                const index = parseInt(this.getAttribute('data-index'));
                downloadFile(index);
            });
        });
        
        document.querySelectorAll('[data-action="remove"]').forEach(btn => {
            btn.addEventListener('click', function() {
                const index = parseInt(this.getAttribute('data-index'));
                removeFile(index);
            });
        });
        
        document.querySelectorAll('.file-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', function() {
                const index = parseInt(this.getAttribute('data-index'));
                files[index].selected = this.checked;
            });
        });
    }
    
    // 预览文件
    function previewFile(index) {
        if (index < 0 || index >= files.length) return;
        
        currentPreviewIndex = index;
        const file = files[index];
        
        // 显示原始图片信息
        originalInfo.textContent = `原始: ${file.name} (${formatFileSize(file.size)})`;
        
        // 显示图片预览
        previewBox.innerHTML = '';
        
        if (file.convertedData) {
            if (file.convertedType === 'svg') {
                // 直接显示SVG内容
                previewBox.innerHTML = file.convertedData;
            } else {
                const img = document.createElement('img');
                img.src = file.convertedData;
                img.alt = file.name;
                previewBox.appendChild(img);
            }
        } else {
            const img = document.createElement('img');
            img.src = file.data;
            img.alt = file.name;
            previewBox.appendChild(img);
        }
        
        // 更新尺寸信息
        imageDimensions.textContent = `原始尺寸: ${file.width} × ${file.height} 像素`;
        currentDimensions = { width: file.width, height: file.height };
        
        // 重置转换信息
        convertedInfo.textContent = '';
        downloadSelectedBtn.classList.add('hidden');
        downloadAllBtn.classList.add('hidden');
        
        // 如果有转换后的数据，显示转换信息
        if (file.convertedData) {
            convertedInfo.textContent = `转换后: ${file.convertedType.toUpperCase()} (${formatFileSize(file.convertedData.length)})`;
            downloadSelectedBtn.classList.remove('hidden');
            downloadAllBtn.classList.remove('hidden');
        }
        
        // 更新调整大小输入框
        const resizeMethod = document.getElementById('resizeMethod');
        if (resizeMethod.value === 'dimension') {
            document.getElementById('targetWidth').value = file.width;
            document.getElementById('targetHeight').value = file.height;
        }
    }
    
    // 更新文件预览
    function updatePreview(index) {
        if (index < 0 || index >= files.length) return;
        
        const file = files[index];
        
        const img = new Image();
        img.src = file.data;
        
        img.onload = function() {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // 应用旋转
            if (Math.abs(currentRotation % 180) === 90) {
                canvas.width = img.height;
                canvas.height = img.width;
            } else {
                canvas.width = img.width;
                canvas.height = img.height;
            }
            
            // 旋转画布
            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.rotate(currentRotation * Math.PI / 180);
            ctx.translate(-img.width / 2, -img.height / 2);
            
            // 应用翻转
            let scaleX = flipHorizontal ? -1 : 1;
            let scaleY = flipVertical ? -1 : 1;
            ctx.scale(scaleX, scaleY);
            
            // 绘制图片
            ctx.drawImage(img, 0, 0);
            
            // 更新预览
            const previewImg = new Image();
            previewImg.src = canvas.toDataURL(`image/${file.type}`);
            previewBox.innerHTML = '';
            previewBox.appendChild(previewImg);
        };
    }
    
    // 移除文件
    function removeFile(index) {
        if (index < 0 || index >= files.length) return;
        
        files.splice(index, 1);
        updateFileList();
        
        if (files.length === 0) {
            previewBox.innerHTML = '<p>转换后的图片将显示在这里</p>';
            originalInfo.textContent = '';
            imageDimensions.textContent = '原始尺寸: 0 × 0 像素';
            currentDimensions = { width: 0, height: 0 };
            downloadSelectedBtn.classList.add('hidden');
            downloadAllBtn.classList.add('hidden');
            currentPreviewIndex = -1;
        } else if (currentPreviewIndex === index) {
            previewFile(0);
        }
    }
    
    // 清空所有文件
    clearAllBtn.addEventListener('click', function() {
        if (files.length === 0) return;
        
        if (confirm('确定要清空所有文件吗？')) {
            files = [];
            // 重置文件输入
            fileInput.value = '';
            updateFileList();
            previewBox.innerHTML = '<p>转换后的图片将显示在这里</p>';
            originalInfo.textContent = '';
            convertedInfo.textContent = '';
            imageDimensions.textContent = '原始尺寸: 0 × 0 像素';
            currentDimensions = { width: 0, height: 0 };
            downloadSelectedBtn.classList.add('hidden');
            downloadAllBtn.classList.add('hidden');
            currentRotation = 0;
            flipHorizontal = false;
            flipVertical = false;
            currentPreviewIndex = -1;
            updateProgress(0, '准备就绪');
        }
    });
    
    // 全选文件
    selectAllBtn.addEventListener('click', function() {
        const checkboxes = document.querySelectorAll('.file-checkbox');
        const allSelected = Array.from(checkboxes).every(cb => cb.checked);
        
        checkboxes.forEach(checkbox => {
            const index = parseInt(checkbox.getAttribute('data-index'));
            files[index].selected = !allSelected;
            checkbox.checked = !allSelected;
        });
    });
    
    // 转换状态文本
    function getStatusText(status) {
        switch(status) {
            case 'pending': return '等待处理';
            case 'processing': return '处理中';
            case 'completed': return '已完成';
            case 'error': return '处理失败';
            default: return '';
        }
    }
    
    // 转换图片
    convertBtn.addEventListener('click', convertAllImages);
    
    async function convertAllImages() {
        if (files.length === 0) {
            alert('请先上传图片！');
            return;
        }
        
        const outputType = outputFormat.value;
        const quality = parseInt(qualitySlider.value) / 100;
        
        // 重置进度条
        updateProgress(0, '准备转换...');
        
        // 标记所有文件为待处理
        files.forEach(file => {
            file.status = 'pending';
            file.convertedData = null;
        });
        updateFileList();
        
        // 转换设置
        const settings = {
            outputType,
            quality,
            currentRotation,
            flipHorizontal,
            flipVertical,
            resizeMethod: document.getElementById('resizeMethod').value,
            resizePercentage: parseInt(document.getElementById('resizePercentage').value) / 100,
            targetWidth: parseInt(document.getElementById('targetWidth').value) || null,
            targetHeight: parseInt(document.getElementById('targetHeight').value) || null,
            keepAspect: document.getElementById('keepAspect').checked
        };
        
        // 开始转换
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            file.status = 'processing';
            updateFileList();
            updateProgress((i / files.length) * 100, `处理中: ${file.name} (${i+1}/${files.length})`);
            
            try {
                if (outputType === 'svg') {
                    await convertToSVG(file);
                } else {
                    await convertSingleFile(file, settings);
                }
                file.status = 'completed';
                
                // 如果是当前预览的文件，更新预览
                if (i === currentPreviewIndex) {
                    previewFile(i);
                }
            } catch (error) {
                console.error(`转换错误: ${file.name}`, error);
                file.status = 'error';
            }
            
            updateFileList();
        }
        
        updateProgress(100, '全部转换完成!');
        downloadSelectedBtn.classList.remove('hidden');
        downloadAllBtn.classList.remove('hidden');
        
        // 3秒后重置进度条
        setTimeout(() => {
            updateProgress(0, '准备就绪');
        }, 3000);
    }
               
    // 修改后的SVG转换函数
    async function convertToSVG(file) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.src = file.data;
            
            img.onload = function() {
                // 获取图片的Base64数据
                const base64Data = file.data.split(',')[1];
                
                // 创建SVG字符串，将图片Base64数据内联
                let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${img.width}" height="${img.height}" viewBox="0 0 ${img.width} ${img.height}">`;
                
                // 添加图片元素
                svgContent += `<image width="${img.width}" height="${img.height}" href="${file.data}"/>`;
                
                svgContent += '</svg>';
                
                // 保存转换后的数据
                file.convertedData = svgContent;
                file.convertedType = 'svg';
                
                resolve();
            };
            
            img.onerror = () => {
                reject(new Error('图片加载失败'));
            };
        });
    }
    
    // 转换单个文件
    async function convertSingleFile(file, settings) {
        return new Promise((resolve, reject) => {
            // 加载图片
            const img = new Image();
            img.src = file.data;
            
            img.onload = function() {
                // 创建Canvas
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                // 应用调整大小
                let targetWidth = img.width;
                let targetHeight = img.height;
                
                if (settings.resizeMethod === 'percentage') {
                    targetWidth = img.width * settings.resizePercentage;
                    targetHeight = img.height * settings.resizePercentage;
                } else if (settings.resizeMethod === 'dimension') {
                    targetWidth = settings.targetWidth || img.width;
                    targetHeight = settings.targetHeight || img.height;
                    
                    if (settings.keepAspect) {
                        const aspect = img.width / img.height;
                        if (targetWidth / aspect <= targetHeight) {
                            targetHeight = targetWidth / aspect;
                        } else {
                            targetWidth = targetHeight * aspect;
                        }
                    }
                }
                
                // 设置Canvas尺寸
                canvas.width = targetWidth;
                canvas.height = targetHeight;
                
                // 应用旋转
                ctx.translate(canvas.width / 2, canvas.height / 2);
                ctx.rotate(settings.currentRotation * Math.PI / 180);
                
                // 应用翻转
                let scaleX = settings.flipHorizontal ? -1 : 1;
                let scaleY = settings.flipVertical ? -1 : 1;
                ctx.scale(scaleX, scaleY);
                
                // 绘制图片
                ctx.drawImage(
                    img, 
                    -targetWidth / 2, 
                    -targetHeight / 2, 
                    targetWidth, 
                    targetHeight
                );
                
                // 转换到目标格式
                let mimeType;
                switch(settings.outputType) {
                    case 'png': mimeType = 'image/png'; break;
                    case 'jpeg': mimeType = 'image/jpeg'; break;
                    case 'webp': mimeType = 'image/webp'; break;
                    case 'gif': mimeType = 'image/gif'; break;
                    case 'bmp': mimeType = 'image/bmp'; break;
                    default: mimeType = 'image/png';
                }
                
                // 获取转换后的数据
                file.convertedData = canvas.toDataURL(mimeType, settings.quality);
                file.convertedType = settings.outputType;
                
                resolve();
            };
            
            img.onerror = () => {
                reject(new Error('图片加载失败'));
            };
        });
    }
    
    // 改进后的下载单个文件函数
    function downloadFile(index) {
        if (index < 0 || index >= files.length) return;
        const file = files[index];
        
        if (!file.convertedData) {
            alert('请先转换该文件');
            return;
        }
        
        let fileName, blob;
        
        if (file.convertedType === 'svg') {
            // SVG文件处理
            fileName = `converted_${file.name.split('.')[0]}.svg`;
            blob = new Blob([file.convertedData], { type: 'image/svg+xml' });
        } else {
            // 其他图片格式
            fileName = `converted_${file.name.split('.')[0]}.${file.convertedType}`;
            
            // 直接从Data URL创建Blob
            const byteString = atob(file.convertedData.split(',')[1]);
            const mimeString = file.convertedData.split(',')[0].split(':')[1].split(';')[0];
            const ab = new ArrayBuffer(byteString.length);
            const ia = new Uint8Array(ab);
            
            for (let i = 0; i < byteString.length; i++) {
                ia[i] = byteString.charCodeAt(i);
            }
            
            blob = new Blob([ab], { type: mimeString });
        }
        
        // 创建下载链接
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        
        // 清理
        setTimeout(() => {
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }, 100);
    }
    
    // 改进后的下载选中文件函数
    downloadSelectedBtn.addEventListener('click', async function() {
        const selectedFiles = files.filter(file => file.selected && file.convertedData);
        
        if (selectedFiles.length === 0) {
            alert('请至少选择一个已转换的文件下载');
            return;
        }
        
        if (selectedFiles.length === 1) {
            const index = files.findIndex(file => file === selectedFiles[0]);
            downloadFile(index);
            return;
        }
        
        // 显示处理中状态
        updateProgress(0, '正在准备下载文件...');
        
        try {
            // 创建ZIP文件
            const zip = new JSZip();
            
            // 添加文件到ZIP
            for (let i = 0; i < selectedFiles.length; i++) {
                const file = selectedFiles[i];
                updateProgress((i / selectedFiles.length) * 100, `正在添加文件: ${file.name}`);
                
                if (file.convertedType === 'svg') {
                    zip.file(`converted_${file.name.split('.')[0]}.svg`, file.convertedData);
                } else {
                    const byteString = atob(file.convertedData.split(',')[1]);
                    const ab = new ArrayBuffer(byteString.length);
                    const ia = new Uint8Array(ab);
                    
                    for (let j = 0; j < byteString.length; j++) {
                        ia[j] = byteString.charCodeAt(j);
                    }
                    
                    zip.file(`converted_${file.name.split('.')[0]}.${file.convertedType}`, ab);
                }
            }
            
            // 生成ZIP文件
            updateProgress(100, '正在生成ZIP文件...');
            const content = await zip.generateAsync({ type: 'blob' });
            
            // 下载ZIP文件
            saveAs(content, "converted_images.zip");
            updateProgress(0, '下载完成');
            
            // 3秒后重置进度条
            setTimeout(() => {
                updateProgress(0, '准备就绪');
            }, 3000);
        } catch (error) {
            console.error('生成ZIP文件失败:', error);
            alert('生成ZIP文件时出错');
            updateProgress(0, '准备就绪');
        }
    });
    
    // 改进后的下载所有文件函数
    downloadAllBtn.addEventListener('click', async function() {
        const convertedFiles = files.filter(file => file.convertedData);
        
        if (convertedFiles.length === 0) {
            alert('没有已转换的文件');
            return;
        }
        
        // 显示处理中状态
        updateProgress(0, '正在准备下载文件...');
        
        try {
            // 创建ZIP文件
            const zip = new JSZip();
            
            // 添加文件到ZIP
            for (let i = 0; i < convertedFiles.length; i++) {
                const file = convertedFiles[i];
                updateProgress((i / convertedFiles.length) * 100, `正在添加文件: ${file.name}`);
                
                if (file.convertedType === 'svg') {
                    zip.file(`converted_${file.name.split('.')[0]}.svg`, file.convertedData);
                } else {
                    const byteString = atob(file.convertedData.split(',')[1]);
                    const ab = new ArrayBuffer(byteString.length);
                    const ia = new Uint8Array(ab);
                    
                    for (let j = 0; j < byteString.length; j++) {
                        ia[j] = byteString.charCodeAt(j);
                    }
                    
                    zip.file(`converted_${file.name.split('.')[0]}.${file.convertedType}`, ab);
                }
            }
            
            // 生成ZIP文件
            updateProgress(100, '正在生成ZIP文件...');
            const content = await zip.generateAsync({ type: 'blob' });
            
            // 下载ZIP文件
            saveAs(content, "all_converted_images.zip");
            updateProgress(0, '下载完成');
            
            // 3秒后重置进度条
            setTimeout(() => {
                updateProgress(0, '准备就绪');
            }, 3000);
        } catch (error) {
            console.error('生成ZIP文件失败:', error);
            alert('生成ZIP文件时出错');
            updateProgress(0, '准备就绪');
        }
    });
    
    // 更新进度条状态函数
    function updateProgress(percentage, status) {
        progressBar.style.width = percentage + '%';
        progressStatus.textContent = status;
    }
    
    // 辅助函数
    function formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' bytes';
        else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
        else return (bytes / 1048576).toFixed(1) + ' MB';
    }
    
    // 初始化所有组件
    initSliders();
    initResize();
    initRotationButtons();
});