<template>
  <div class="music-player">
    <audio
      ref="audioApi"
      :src="path"
      controls
    />
  </div>
</template>

<script>
import _ from 'lodash';
import { mapState, mapMutations, mapActions } from 'vuex';
import Plyr from 'plyr';

export default {
  name: 'MusicPlayer',

  data() {
    return {
      player: null,
      plyrVolumeDOM: null
    };
  },

  computed: {
    ...mapState('musicPlayer', [
      'dance',
      'isFading',
      'isPlaying',
      'volume',
      'musicDuration',
      'fadeDuration'
    ]),

    ...mapState('settings', [
      'localPath',
      'clashes'
    ]),

    /**
       * Modify the path to make it possible to open in Electron bundle
       *
       * @return {void}
       */
    path() {
      if (!process.env.IS_WEB) {
        return this.dance.path ? `file://${this.dance.path}` : null;
      }
      return this.dance.path ? this.dance.path.replace(this.localPath, 'music') : null;
    },

    /**
       * Return the playing song's dance type
       *
       * @return {void}
       */
    danceType() {
      return _.get(this.dance, ['types', 0,'type']);
    }
  },

  methods: {
    ...mapActions('musicPlayer', [
      'fadeOut'
    ]),

    ...mapMutations('musicPlayer', [
      'setDanceIsDone',
      'setVolume'
    ]),

    /**
       * Reset the volume and start playing the music
       *
       * @return {void}
       */
    playMusic() {
      const audioApi = this.$refs.audioApi;

      audioApi.pause();
      audioApi.currentTime = 0;
      this.$store.commit('musicPlayer/setIsFading', false);
      this.setDanceIsDone(false);
      this.setVolume(1);

      audioApi.addEventListener('canplay', () =>
        audioApi.play()
      );
    },

    /**
       * Pause the player
       *
       * @return {void}
       */
    stopMusic() {
      this.$refs.audioApi.pause();
    },

    /**
       * Set the interval loop the check for the good musicDuration before fadeOut
       *
       * @return {void}
       */
    setTimeUpdateEvent() {
      const audioApi = this.$refs.audioApi;

      const stopMusic = () => {
        let musicDuration;
        if (this.danceType !== 'pasodoble') {
          musicDuration = this.musicDuration - this.$store.state.musicPlayer.fadeDuration;
        } else {
          const explosions = this.getExplosions(this.dance);
          musicDuration = explosions.length > 1 ? explosions[this.clashes - 2] : explosions[0];
        }

        if (audioApi.currentTime > musicDuration && !audioApi.paused) {
          if (!this.isFading && this.danceType !== 'pasodoble') {
            this.fadeOut();
          } else if (this.danceType === 'pasodoble') {
            this.$store.commit('musicPlayer/setIsPlaying', false);
            this.$store.commit('musicPlayer/setIsFading', false);
            this.setDanceIsDone(true);
          }
          audioApi.removeEventListener('timeupdate', stopMusic);
        }
      };

      audioApi.removeEventListener('timeupdate', stopMusic);
      audioApi.addEventListener('timeupdate', stopMusic);
    },

    /**
       * Reset the src of the player and make it look not activated in the browser
       *
       * @return {void}
       */
    resetPlayer() {
      const audioApi = this.$refs.audioApi;

      audioApi.src = '';
      audioApi.load();
    },

    /**
       * Set the volume from plyr in data on change
       *
       * @return {void}
       */
    onPlyrVolumeChange() {
      this.player.on('volumechange', () => {
        this.setVolume(this.player.volume);
      });
    },

    /**
       * Parse the song name to get the timing inside the "[clashes ...]" marks
       *
       * @param {Object} song
       * @return {Array}
       */
    getExplosions(song) {
      return song.name.split(/(\[clashes .*\])/)[1]
        .replace(/[\[(clashes)\]]/g, '')
        .split('|')
        .map((explosionString) => {
          const explosionTimeArra = explosionString.split('m');
          return (parseInt(explosionTimeArra[0], 10) * 60) + parseFloat(explosionTimeArra[1], 10);
        });
    },

    /**
       * Force DOM update of the plyr volume
       * ~ Resolve bug with thumb not updating in input[type=range]
       *
       * @param {Number} volume
       * @return {void}
       */
    setPlyrVolume(volume) {
      this.player.volume = this.volume;
      this.plyrVolumeDOM.value = this.volume * 10;
    }
  },

  watch: {

    /**
       * Watch changes of dance object to reset the player if it's empty
       *
       * @param {Object} danceState
       * @return {void}
       */
    dance(danceState) {
      if (!Object.keys(danceState).length) {
        this.resetPlayer();
      }
    },

    /**
       * Watch changes of isPlayer to start the music when it's true
       *
       * @param {Boolean} isPlayingState
       * @return {void}
       */
    isPlaying(isPlayingState) {
      if (isPlayingState) {
        this.playMusic();
        this.setTimeUpdateEvent();
      }

      this.stopMusic();
    },

    /**
       * Watch changes of volume to update the player
       *
       * @return {void}
       */
    volume() {
      this.$refs.audioApi.volume = this.volume;
      this.setPlyrVolume(this.volume);
    },

    /**
       * Watch changes of musicDuration to update interval loop
       *
       * @return {void}
       */
    musicDuration() {
      this.setTimeUpdateEvent();
    },

    /**
       * Watch changes of musicDuration to update interval loop
       *
       * @return {void}
       */
    fadeDuration() {
      this.setTimeUpdateEvent();
    }
  },

  /**
     * Lifecyle
     *
     * @return {void}
     */
  mounted() {
    this.player = new Plyr(this.$refs.audioApi, {
      speed: {
        selected: 1,
        options: [0.90, 0.91, 0.92, 0.93, 0.94, 0.95, 1, 1.05, 1.06, 1.07, 1.08, 1.09, 1.1]
      }
    });
    this.plyrVolumeDOM = this.player.elements.volume;

    this.setPlyrVolume(this.volume * 10);
    this.setTimeUpdateEvent();
    this.onPlyrVolumeChange();
  }
};
</script>

<style lang="scss">
  @import "~plyr/src/sass/plyr";

  /**
   * SMALL
   */
  .music-player {

    .plyr{
      $notBlackColor: $blue;

      .button, button{
        border-radius: rem-calc(4);
      }

      &__time{
        color: $light-gray;
        font-weight: 600;
      }

      input[type=range] {
        &:active{
          &::-webkit-slider-thumb{
            background: $medium-gray;
          }
        }
      }

      &--audio{
        background: none;
        border: none;

         input[type='range']::-webkit-slider-runnable-track{
          background-color: $dark-gray;
        }

        .plyr{
          &__controls{
            background: none;
            border: none;

            button{
              color: smart-scale($dark-gray, -20%);

              &.tab-focus:focus, &:hover{
                color: $white;
                background: $notBlackColor;
              }
            }
          }
        }
      }

      &__progress, &__volume{
        $backgroundColor: smart-scale($details, -40%);

        &--display{
          color: $notBlackColor;
          background: $backgroundColor;
          overflow: hidden;
        }

        &--buffer{
          background: $backgroundColor;
          &::-webkit-progress-value{
            background: rgba($light-gray, 0.1);
          }
        }

        &--played{
          background: transparent;
          &::-webkit-progress-value{
            background: $notBlackColor;
          }
        }
      }
    }

    /**
     * MEDIUM UP
     */
    @include breakpoint(medium) {
    }

    /**
     * LARGE UP
     */
    @include breakpoint(large) {
    }

    /**
     * XLARGE UP
     */
    @include breakpoint(xlarge) {
    }
  }
</style>
