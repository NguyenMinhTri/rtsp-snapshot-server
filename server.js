const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// CORS - allow all origins for camera viewing
app.use(cors());

// Snapshot cache directory
const SNAPSHOT_DIR = path.join(__dirname, 'snapshots');
if (!fs.existsSync(SNAPSHOT_DIR)) {
    fs.mkdirSync(SNAPSHOT_DIR, { recursive: true });
}

// Camera snapshot cache
// Key: camera URL hash, Value: { path, timestamp, capturing, lastAccessed }
const cameraCache = new Map();

// Config
const SNAPSHOT_INTERVAL_MS = 10000;  // 10 seconds
const SNAPSHOT_TIMEOUT_MS = 8000;    // 8 seconds max for ffmpeg
const MAX_CACHE_AGE_MS = 30000;      // 30 seconds before forced refresh
const IDLE_TIMEOUT_MS = 60000;       // 60 seconds - stop caching if no requests

// Cleanup idle cameras every 30 seconds
setInterval(() => {
    const now = Date.now();
    let cleaned = 0;
    for (const [hash, entry] of cameraCache.entries()) {
        if (entry.lastAccessed && (now - entry.lastAccessed) > IDLE_TIMEOUT_MS) {
            // Delete cached snapshot file
            if (entry.path && fs.existsSync(entry.path)) {
                try {
                    fs.unlinkSync(entry.path);
                } catch (e) { }
            }
            cameraCache.delete(hash);
            cleaned++;
        }
    }
    if (cleaned > 0) {
        console.log(`[Cleanup] Removed ${cleaned} idle camera(s)`);
    }
}, 30000);

/**
 * Generate a simple hash for camera URL (for filename)
 */
function hashUrl(url) {
    let hash = 0;
    for (let i = 0; i < url.length; i++) {
        const char = url.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
}
// ============ LOAD BALANCING ============
let activeCaptures = 0;
const MAX_CAPTURES_BEFORE_THROTTLE = 3;
const MAX_CAPTURES_HARD_LIMIT = 8;

// Get quality settings based on current load
function getQualitySettings() {
    // Under load: reduce quality to prevent server overload
    if (activeCaptures >= MAX_CAPTURES_BEFORE_THROTTLE) {
        return { width: 320, quality: 8 }; // Ultra low: 320x180, lower quality
    }
    return { width: 426, quality: 5 }; // Normal: 426x240, decent quality
}

/**
 * Capture snapshot from RTSP using ffmpeg
 * Optimized for free tier: low resolution, fast startup
 * Returns Promise<string> with snapshot file path
 */
function captureSnapshot(rtspUrl, outputPath) {
    return new Promise((resolve, reject) => {
        // Check hard limit
        if (activeCaptures >= MAX_CAPTURES_HARD_LIMIT) {
            reject(new Error('Server overloaded. Please try again later.'));
            return;
        }

        activeCaptures++;
        const settings = getQualitySettings();
        let cleanedUp = false; // Prevent double cleanup

        const args = [
            '-y',                           // Overwrite output
            '-hide_banner',
            '-loglevel', 'error',
            // === WAIT FOR STREAM TO STABILIZE ===
            '-rtsp_transport', 'tcp',       // Use TCP for stability
            '-i', rtspUrl,                  // Input RTSP URL
            // === SKIP INITIAL GRAY FRAMES ===
            '-ss', '1',                     // Skip first 1 second to avoid gray frames
            // === LOW QUALITY FOR FREE TIER ===
            '-vf', `scale=${settings.width}:-2`,  // Scale down (426x240 or 320x180)
            '-frames:v', '1',               // Capture 1 frame only
            '-q:v', String(settings.quality), // Quality (2-10, lower = better, higher = smaller)
            '-f', 'image2',                 // Output format
            outputPath                      // Output file
        ];

        console.log(`[Capture] Starting (active: ${activeCaptures}, quality: ${settings.width}x, q=${settings.quality})`);

        const ffmpeg = spawn('ffmpeg', args);

        let stderr = '';
        let resolved = false;

        ffmpeg.stderr.on('data', (data) => {
            stderr += data.toString();
        });

        const cleanup = () => {
            if (!cleanedUp) {
                cleanedUp = true;
                activeCaptures = Math.max(0, activeCaptures - 1); // Prevent negative
            }
        };

        ffmpeg.on('close', (code) => {
            cleanup();
            if (resolved) return;
            resolved = true;

            if (code === 0 && fs.existsSync(outputPath)) {
                const stats = fs.statSync(outputPath);
                console.log(`[Capture] Success (size: ${Math.round(stats.size / 1024)}KB, active: ${activeCaptures})`);
                resolve(outputPath);
            } else {
                console.error(`[Capture] Failed: ${stderr.slice(-100)}`);
                reject(new Error(`FFmpeg failed with code ${code}`));
            }
        });

        ffmpeg.on('error', (err) => {
            cleanup();
            if (resolved) return;
            resolved = true;
            reject(err);
        });

        // Timeout failsafe - 15 seconds (includes -ss 1 delay)
        setTimeout(() => {
            if (resolved) return;
            resolved = true;
            ffmpeg.kill('SIGKILL');
            cleanup();
            reject(new Error('FFmpeg timeout'));
        }, 15000);
    });
}

/**
 * Get or create snapshot for a camera
 * Implements caching and sharing across multiple clients
 * Tracks lastAccessed for idle camera cleanup
 */
async function getSnapshot(rtspUrl) {
    const urlHash = hashUrl(rtspUrl);
    const snapshotPath = path.join(SNAPSHOT_DIR, `${urlHash}.jpg`);

    let cacheEntry = cameraCache.get(urlHash);
    const now = Date.now();

    // Update lastAccessed time on every request
    if (cacheEntry) {
        cacheEntry.lastAccessed = now;
    }

    // Check if we have a valid cached snapshot
    if (cacheEntry) {
        const age = now - cacheEntry.timestamp;

        // If fresh enough, return cached
        if (age < SNAPSHOT_INTERVAL_MS && fs.existsSync(cacheEntry.path)) {
            return {
                path: cacheEntry.path,
                age: age,
                nextRefresh: SNAPSHOT_INTERVAL_MS - age
            };
        }

        // If capture is in progress, wait and return existing
        if (cacheEntry.capturing) {
            if (fs.existsSync(cacheEntry.path)) {
                return {
                    path: cacheEntry.path,
                    age: age,
                    nextRefresh: SNAPSHOT_INTERVAL_MS - (age % SNAPSHOT_INTERVAL_MS)
                };
            }
            // Wait a bit for capture to complete
            await new Promise(resolve => setTimeout(resolve, 500));
            return getSnapshot(rtspUrl); // Retry
        }
    }

    // Need to capture new snapshot
    cameraCache.set(urlHash, {
        path: snapshotPath,
        timestamp: cacheEntry?.timestamp || 0,
        capturing: true,
        lastAccessed: now
    });

    try {
        await captureSnapshot(rtspUrl, snapshotPath);

        cameraCache.set(urlHash, {
            path: snapshotPath,
            timestamp: Date.now(),
            capturing: false,
            lastAccessed: now
        });

        return {
            path: snapshotPath,
            age: 0,
            nextRefresh: SNAPSHOT_INTERVAL_MS
        };
    } catch (error) {
        console.error(`Snapshot error for ${rtspUrl.substring(0, 50)}...:`, error.message);

        cameraCache.set(urlHash, {
            path: snapshotPath,
            timestamp: cacheEntry?.timestamp || 0,
            capturing: false,
            lastAccessed: now
        });

        // If we have old snapshot, return it
        if (cacheEntry && fs.existsSync(cacheEntry.path)) {
            return {
                path: cacheEntry.path,
                age: now - cacheEntry.timestamp,
                nextRefresh: SNAPSHOT_INTERVAL_MS,
                stale: true
            };
        }

        throw error;
    }
}

/**
 * Decode special characters in RTSP URL
 * Some URLs have special chars encoded as words to pass through query strings
 */
function decodeRtspUrl(url) {
    return url
        .replaceAll("question", "?")
        .replaceAll("equal", "=")
        .replaceAll("ampersand", "&");
}

// ============ API Routes ============

/**
 * GET /snapshot
 * Query params:
 *   - url: RTSP URL (required)
 * Returns: JPEG image with cache headers
 */
app.get('/snapshot', async (req, res) => {
    let rtspUrl = req.query.url;

    if (!rtspUrl) {
        return res.status(400).json({ error: 'Missing url parameter' });
    }

    // Decode special characters
    rtspUrl = decodeRtspUrl(rtspUrl);

    try {
        const result = await getSnapshot(rtspUrl);

        // Set cache headers
        res.setHeader('Content-Type', 'image/jpeg');
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('X-Snapshot-Age', result.age);
        res.setHeader('X-Next-Refresh', result.nextRefresh);
        if (result.stale) {
            res.setHeader('X-Snapshot-Stale', 'true');
        }

        // Stream the file
        const stream = fs.createReadStream(result.path);
        stream.pipe(res);
    } catch (error) {
        console.error('Snapshot API error:', error.message);
        res.status(500).json({
            error: 'Failed to capture snapshot',
            message: error.message
        });
    }
});

/**
 * GET /info
 * Query params:
 *   - url: RTSP URL (required)
 * Returns: JSON with snapshot info (age, next refresh)
 */
app.get('/info', async (req, res) => {
    const rtspUrl = req.query.url;

    if (!rtspUrl) {
        return res.status(400).json({ error: 'Missing url parameter' });
    }

    const urlHash = hashUrl(rtspUrl);
    const cacheEntry = cameraCache.get(urlHash);

    if (cacheEntry && fs.existsSync(cacheEntry.path)) {
        const age = Date.now() - cacheEntry.timestamp;
        res.json({
            cached: true,
            age: age,
            nextRefresh: Math.max(0, SNAPSHOT_INTERVAL_MS - age),
            interval: SNAPSHOT_INTERVAL_MS
        });
    } else {
        res.json({
            cached: false,
            nextRefresh: 0,
            interval: SNAPSHOT_INTERVAL_MS
        });
    }
});

/**
 * GET /health
 * Health check for Render.com
 */
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        uptime: process.uptime(),
        cameras: cameraCache.size
    });
});

/**
 * GET /
 * Root endpoint with API info
 */
app.get('/', (req, res) => {
    res.json({
        name: 'RTSP Snapshot Server',
        version: '1.0.0',
        endpoints: {
            '/snapshot?url=RTSP_URL': 'Get JPEG snapshot',
            '/info?url=RTSP_URL': 'Get snapshot info',
            '/health': 'Health check'
        },
        config: {
            interval: `${SNAPSHOT_INTERVAL_MS / 1000}s`,
            timeout: `${SNAPSHOT_TIMEOUT_MS / 1000}s`
        }
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 RTSP Snapshot Server running on port ${PORT}`);
    console.log(`📸 Snapshot interval: ${SNAPSHOT_INTERVAL_MS / 1000}s`);
});
