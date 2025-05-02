import { promisify } from 'node:util';
import child_process from 'node:child_process';
const execFile = promisify(child_process.execFile);
import { Socket } from 'node:net';
import { Buffer } from 'node:buffer';
import { createHash } from 'node:crypto';

export async function gslist(name, query, server = 'master.openspy.net') {
  let bin = process.cwd() + '/bin/gslist';
  let args = [
    '-o', '5',
    '-x', server,
    '-n', name,
    '-X', query.map(e => "\\" + e).join('')
  ];
  try {
    const { error, stdout, stderr } = await execFile(bin, args);
    if (error) {
      console.error(`exec error: ${error}`);
      return
    }
    if (!stdout) {
      return
    }
    // console.log(stdout);
    let data = [];
    stdout.trim().split('\n').forEach((line) => {
      let item = {};
      let arr = line.split('\\')
      item.ip = arr[0].trim().split(':')[0];
      item.port = Number(arr[0].trim().split(':')[1]);
      item.date = Date.now();
      item.hash = createHash('sha1').update(line).digest('base64');
      // item.gamename = name;
      item.fields = {};
      arr.shift();
      while (arr.length != 0) {
        item.fields[arr[0]] = arr[1];
        arr = arr.slice(2);
      }
      data.push(item);
    });
    return data;
  } catch (err) {
    console.error(err);
    return
  }
}

export async function checkPort(port, host, timeout = 2000) {
  return new Promise((resolve, reject) => {
    const socket = new Socket();
    socket.setTimeout(timeout);
    console.log(`Checking port: ${host}:${port}`)

    socket.on('connect', () => {
      console.log('Connect');
      socket.destroy();
      resolve(true);
    });

    socket.on('timeout', () => {
      console.log('Timeout');
      socket.destroy();
      resolve(false);
    });

    socket.on('error', () => {
      console.log('Error');
      resolve(false);
    });

    socket.connect({ family: 4, host: host, port: port });
  });
}

export function getPublicIP(int) {
  let buf = Buffer.allocUnsafe(4);
  buf.writeInt32LE(int);
  return buf.join('.')
}
