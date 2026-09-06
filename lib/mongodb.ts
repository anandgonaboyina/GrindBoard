import { MongoClient } from 'mongodb';
import mongoose from 'mongoose';
import dns from 'dns';

// Set public DNS servers for Node.js DNS resolution to bypass local ISP/Wi-Fi DNS blocks on SRV queries
try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch (e) {
  console.warn('Could not set custom DNS servers:', e);
}

// Helper to resolve mongodb+srv URIs using DNS-over-HTTPS (DoH)
async function resolveMongoSrv(uri: string): Promise<string> {
  if (!uri.startsWith('mongodb+srv://')) return uri;

  console.log('Resolving mongodb+srv URI via DNS-over-HTTPS (DoH) to bypass local DNS blocks...');
  try {
    const urlStr = uri.replace(/^mongodb\+srv:\/\//, 'http://');
    const parsed = new URL(urlStr);
    const credentials = parsed.username ? `${parsed.username}:${parsed.password}@` : '';
    const host = parsed.hostname;
    const pathname = parsed.pathname;
    const searchParams = new URLSearchParams(parsed.search);

    let srvAnswer = null;
    const srvUrlCf = `https://cloudflare-dns.com/dns-query?name=_mongodb._tcp.${host}&type=SRV`;
    const srvUrlGg = `https://dns.google/resolve?name=_mongodb._tcp.${host}&type=SRV`;

    try {
      const res = await fetch(srvUrlCf, { headers: { 'accept': 'application/dns-json' } });
      const data = await res.json();
      if (data.Answer && data.Answer.length > 0) srvAnswer = data.Answer;
    } catch (err) {
      console.warn('Cloudflare DoH SRV resolution failed, trying Google...');
    }

    if (!srvAnswer) {
      try {
        const res = await fetch(srvUrlGg);
        const data = await res.json();
        if (data.Answer && data.Answer.length > 0) srvAnswer = data.Answer;
      } catch (err) { }
    }

    if (!srvAnswer || srvAnswer.length === 0) throw new Error('Failed to resolve SRV records');

    const hosts = srvAnswer.map((ans: any) => {
      const parts = ans.data.trim().split(/\s+/);
      const port = parts[parts.length - 2];
      let hostname = parts[parts.length - 1];
      if (hostname.endsWith('.')) hostname = hostname.slice(0, -1);
      return `${hostname}:${port}`;
    });

    let txtAnswer = null;
    const txtUrlCf = `https://cloudflare-dns.com/dns-query?name=${host}&type=TXT`;
    const txtUrlGg = `https://dns.google/resolve?name=${host}&type=TXT`;

    try {
      const res = await fetch(txtUrlCf, { headers: { 'accept': 'application/dns-json' } });
      const data = await res.json();
      if (data.Answer && data.Answer.length > 0) txtAnswer = data.Answer;
    } catch (err) { }

    if (!txtAnswer) {
      try {
        const res = await fetch(txtUrlGg);
        const data = await res.json();
        if (data.Answer && data.Answer.length > 0) txtAnswer = data.Answer;
      } catch (err) { }
    }

    let txtOptions = '';
    if (txtAnswer && txtAnswer.length > 0) {
      txtOptions = txtAnswer[0].data.replace(/^"|"$/g, '');
    }

    const resolvedParams = new URLSearchParams(txtOptions);
    for (const [key, value] of searchParams.entries()) {
      resolvedParams.set(key, value);
    }
    resolvedParams.set('ssl', 'true');

    return `mongodb://${credentials}${hosts.join(',')}${pathname}?${resolvedParams.toString()}`;
  } catch (error) {
    console.error('DoH resolution error, falling back to original URI:', error);
    return uri;
  }
}

const uri = process.env.DATABASE_URL || 'mongodb://127.0.0.1:27017/productivedashboard';

// ---------------------------------------------------------
// 1. LEGACY NATIVE MONGODB (For Login, Store, etc.)
// ---------------------------------------------------------
let client: MongoClient;
let clientPromise: Promise<MongoClient>;

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
  var mongoose: any;
}

const connectClient = async (): Promise<MongoClient> => {
  const resolvedUri = await resolveMongoSrv(uri);
  client = new MongoClient(resolvedUri, {});
  return client.connect();
};

if (process.env.NODE_ENV === 'development') {
  if (!global._mongoClientPromise) {
    global._mongoClientPromise = connectClient();
  }
  clientPromise = global._mongoClientPromise;
} else {
  clientPromise = connectClient();
}

// ---------------------------------------------------------
// 2. NEW MONGOOSE CONNECTION (For Settings, Timetable, Tasks)
// ---------------------------------------------------------
let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export async function dbConnect() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    const resolvedUri = await resolveMongoSrv(uri);
    cached.promise = mongoose.connect(resolvedUri, { bufferCommands: false }).then((mongooseInstance) => {
      return mongooseInstance;
    });
  }
  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }
  return cached.conn;
}

// Ensure default export is clientPromise to keep legacy routes from crashing
export default clientPromise;