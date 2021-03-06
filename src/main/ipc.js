import path from 'path';
import jsonfile from 'jsonfile';
import log from 'electron-log';
import { ipcMain } from 'electron'; // eslint-disable-line
import { musicDir, musicTypes } from '../server/config';
import fileManager from '../server/managers/fileManager';
import timingManager from '../server/managers/timingManager';
import { metadataApi } from '../server/managers/musicManager';

export const progress = {
  songsTreated: 0,
  totalSongs: 0
};

export default () => {
  ipcMain.on('test', (event) => {
    event.returnValue = 'test';
  });

  ipcMain.on('musictypes', (event) => {
    event.returnValue = musicTypes;
  });

  ipcMain.on('edit-song', async (event, args) => {
    const { song, type } = args;
    const metadata = { ...song.metadata, genre: type, comment: 'dmp' };

    try {
      await metadataApi.set(song, metadata);
      event.sender.send('edit-song-response', {
        code: 200
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
      event.returnValue = fileManager.createInitialFolder();
    } catch (err) {
      event.returnValue = {
        code: 400,
        error: err
      };
    }
  });

  ipcMain.on('generate', (event) => {
    progress.songsTreated = 0;
    progress.totalSongs = 0;

    fileManager.getRounds(musicDir, event)
      .then((res) => {
        try {
          jsonfile.writeFileSync(path.join(musicDir, '..', '.data', 'db.json'), res);
        } catch (err) {
          log.error(err);
        }
        event.sender.send('generate-response', res);
      }).catch(err => console.error(err));
  });

  ipcMain.on('get-rounds', (event) => {
    const jsonTiming = jsonfile.readFileSync(path.join(musicDir, '..', '.data', 'db.json'));
    event.sender.send('get-rounds-response', jsonTiming);
  });
};
