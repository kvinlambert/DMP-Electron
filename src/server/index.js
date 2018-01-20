import path from 'path';
import jsonfile from 'jsonfile';
import { ipcMain } from 'electron';
// import childProcess from 'child_process';
import { musicDir, musicTypes } from './config';
import fileManager from './managers/fileManager';
import timingManager from './managers/timingManager';

export default () => {
  ipcMain.on('test', (event) => {
    event.returnValue = 'test';
  });

  ipcMain.on('musictypes', (event) => {
    event.returnValue = musicTypes;
  });

  ipcMain.on('edit-song', (event, args) => {
    const { songPath, type } = args;

    try {
      const responseCode = fileManager.addTextToFile(songPath, type);

      event.sender.send('edit-song-response', {
        code: responseCode
      });
    } catch (err) {
      event.sender.send('edit-song-response', {
        code: 400,
        error: err
      });
    }
  });

  ipcMain.on('create-folders', (event) => {
    try {
      timingManager.createFolders();

      event.sender.send('create-folders-response', {
        code: 200
      });
    } catch (err) {
      event.sender.send('create-folders-response', {
        code: 400,
        error: err
      });
    }
  });

  ipcMain.on('init', (event) => {
    try {
      timingManager.createInitialFolder();

      event.returnValue = {
        code: 200
      };
    } catch (err) {
      event.returnValue = {
        code: 400,
        error: err
      };
    }
  });

  ipcMain.on('generate', () => {
    fileManager.getRounds(musicDir)
      .then((res) => {
        jsonfile.writeFileSync(path.join('src', 'server', 'data', 'db.json'), res);
        event.sender.send('generate-response', res);
      }).catch(err => console.error(err));
    // const worker = childProcess.fork('./src/server/workers/getRoundsWorker.js');
    // worker.on('message', (res) => {
    //   event.sender.send('generate-response', res);
    // });
  });

  ipcMain.on('get-rounds', (event) => {
    const jsonTiming = jsonfile.readFileSync(path.join('src', 'server', 'data', 'db.json'));
    event.sender.send('get-rounds-response', jsonTiming);
  });
};