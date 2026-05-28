document.addEventListener('DOMContentLoaded', () => {
    // --- GOOGLE DRIVE RESUME LINK CONFIGURATION ---
    // 1. Get your Google Drive Sharable Link (Make sure it's set to "Anyone with the link")
    // 2. It usually looks like: https://drive.google.com/file/d/1XyZ.../view?usp=sharing
    const DRIVE_FILE_URL = 'https://drive.google.com/file/d/1GskSQsf2emS5Bm6lJgQ0An9KqIbzRcgK/view?usp=sharing'; // <-- PASTE YOUR LINK HERE

    const resumeIframe = document.getElementById('resumeIframe');
    const downloadBtn = document.getElementById('downloadResume');

    if (DRIVE_FILE_URL && DRIVE_FILE_URL !== '') {
        // Extract File ID from the URL
        const fileIdMatch = DRIVE_FILE_URL.match(/\/d\/(.+?)\//);
        
        if (fileIdMatch && fileIdMatch[1]) {
            const fileId = fileIdMatch[1];
            
            // Format for Embedding
            const embedUrl = `https://drive.google.com/file/d/${fileId}/preview`;
            
            // Format for Downloading
            const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
            
            // Set values
            if (resumeIframe) resumeIframe.src = embedUrl;
            if (downloadBtn) downloadBtn.href = downloadUrl;
        } else {
            console.error("Invalid Google Drive Link. Please use a link like: https://drive.google.com/file/d/FILE_ID/view");
        }
    }

    // Add some flair - Fade in effect
    const container = document.querySelector('.resume-container');
    if (container) {
        container.style.opacity = '0';
        container.style.transform = 'translateY(20px)';
        container.style.transition = 'all 0.8s ease-out';
        
        setTimeout(() => {
            container.style.opacity = '1';
            container.style.transform = 'translateY(0)';
        }, 100);
    }
});


