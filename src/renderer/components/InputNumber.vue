<template>
  <div class="input-number">
    <div class="grid-x align-middle">
      <div
        class="small-2 medium-3 large-4 cell text-right input-number__sign"
        @click="decrement(steps)"
      >
        <span uk-icon="icon: minus-circle; ratio: 0.7"></span>
      </div>
      <div class="auto cell input-number__text">
        {{ humanizedTime }}
      </div>
      <div
        class="small-2 medium-3 large-4 cell text-left  input-number__sign"
        @click="increment(steps)"
      >
        <span uk-icon="icon: plus-circle; ratio: 0.7"></span>
      </div>
    </div>
  </div>
</template>

<script>
import humanizeDuration from 'humanize-duration';
import _ from 'lodash';
import UIkit from 'uikit';
import Icons from 'uikit/dist/js/uikit-icons';

UIkit.use(Icons);

export default {
  name: 'InputNumber',

  props: {
    name: {
      type: String,
      require: true,
      default: ''
    },

    steps: {
      type: Number,
      default: 1
    },

    time: {
      type: Number,
      required: true,
      default: 0
    }
  },

  computed: {

    /**
       * Return readable time duration
       *
       * @return {String}
       */
    humanizedTime() {
      return humanizeDuration(this.time, {
        language: 'en',
        delimiter: ' ',
        unitMeasures: {
          m: 60,
          s: 1
        },
        units: ['m', 's']
      });
    }
  },

  methods: {

    /**
       * Increment the input by given value
       *
       * @param {Number} value
       * @return {void}
       */
    increment(value) {
      this.$store.commit(`musicPlayer/set${_.upperFirst(this.name)}`, this.$store.state.musicPlayer[this.name] + value);
    },

    /**
       * Decrement the input by given value
       *
       * @param {Number} value
       * @return {void}
       */
    decrement(value) {
      this.$store.commit(`musicPlayer/set${_.upperFirst(this.name)}`, this.$store.state.musicPlayer[this.name] - value);
    }
  }
};
</script>

<style lang="scss">

  /**
   * SMALL
   */
  .input-number {
    * {
      user-select: none;
    }

    &__text{
      font-size: rem-calc(12);
      color: $light-gray;
    }

    &__sign{
      cursor: pointer;
      color: $light-gray;

      span[uk-icon]{
        svg *{
          stroke: $light-gray;
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
