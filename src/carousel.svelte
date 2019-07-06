<script>
  export let target;
  export let height;
  export let width;
  export let images;
  export let index;
</script>

<style>
  .btn.btn-action {
    padding-left: 0;
    padding-right: 0;
    width: 1.8rem;
    cursor: pointer;
  }

  .btn.btn-action.btn-lg {
    width: 2rem;
  }

  .img-responsive {
    display: block;
    height: auto;
    max-width: 100%;
  }

  .carousel
    .carousel-locator:nth-of-type(1):checked
    ~ .carousel-container
    .carousel-item:nth-of-type(1),
  .carousel
    .carousel-locator:nth-of-type(2):checked
    ~ .carousel-container
    .carousel-item:nth-of-type(2),
  .carousel
    .carousel-locator:nth-of-type(3):checked
    ~ .carousel-container
    .carousel-item:nth-of-type(3),
  .carousel
    .carousel-locator:nth-of-type(4):checked
    ~ .carousel-container
    .carousel-item:nth-of-type(4),
  .carousel
    .carousel-locator:nth-of-type(5):checked
    ~ .carousel-container
    .carousel-item:nth-of-type(5),
  .carousel
    .carousel-locator:nth-of-type(6):checked
    ~ .carousel-container
    .carousel-item:nth-of-type(6),
  .carousel
    .carousel-locator:nth-of-type(7):checked
    ~ .carousel-container
    .carousel-item:nth-of-type(7),
  .carousel
    .carousel-locator:nth-of-type(8):checked
    ~ .carousel-container
    .carousel-item:nth-of-type(8) {
    animation: carousel-slidein 0.75s ease-in-out 1;
    opacity: 1;
    z-index: 100;
  }
  .carousel
    .carousel-locator:nth-of-type(1):checked
    ~ .carousel-nav
    .nav-item:nth-of-type(1),
  .carousel
    .carousel-locator:nth-of-type(2):checked
    ~ .carousel-nav
    .nav-item:nth-of-type(2),
  .carousel
    .carousel-locator:nth-of-type(3):checked
    ~ .carousel-nav
    .nav-item:nth-of-type(3),
  .carousel
    .carousel-locator:nth-of-type(4):checked
    ~ .carousel-nav
    .nav-item:nth-of-type(4),
  .carousel
    .carousel-locator:nth-of-type(5):checked
    ~ .carousel-nav
    .nav-item:nth-of-type(5),
  .carousel
    .carousel-locator:nth-of-type(6):checked
    ~ .carousel-nav
    .nav-item:nth-of-type(6),
  .carousel
    .carousel-locator:nth-of-type(7):checked
    ~ .carousel-nav
    .nav-item:nth-of-type(7),
  .carousel
    .carousel-locator:nth-of-type(8):checked
    ~ .carousel-nav
    .nav-item:nth-of-type(8) {
    color: #f7f8f9;
  }
  .carousel {
    background: #f7f8f9;
    display: block;
    overflow: hidden;
    -webkit-overflow-scrolling: touch;
    position: relative;
    width: 100%;
    z-index: 1;
  }
  .carousel .carousel-container {
    height: 100%;
    left: 0;
    position: relative;
  }
  .carousel .carousel-container::before {
    content: "";
    display: block;
    padding-bottom: 56.25%;
  }
  .carousel .carousel-container .carousel-item {
    animation: carousel-slideout 1s ease-in-out 1;
    height: 100%;
    left: 0;
    margin: 0;
    opacity: 0;
    position: absolute;
    top: 0;
    width: 100%;
  }
  .carousel .carousel-container .carousel-item:hover .item-next,
  .carousel .carousel-container .carousel-item:hover .item-prev {
    opacity: 1;
  }
  .carousel .carousel-container .item-next,
  .carousel .carousel-container .item-prev {
    background: rgba(247, 248, 249, 0.25);
    border-color: rgba(247, 248, 249, 0.5);
    color: #f7f8f9;
    opacity: 0;
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    transition: all 0.4s;
    z-index: 100;
  }
  .carousel .carousel-container .item-prev {
    left: 1rem;
  }
  .carousel .carousel-container .item-next {
    right: 1rem;
  }
  .carousel .carousel-nav {
    bottom: 0.4rem;
    display: flex;
    display: -ms-flexbox;
    -ms-flex-pack: center;
    justify-content: center;
    left: 50%;
    position: absolute;
    transform: translateX(-50%);
    width: 10rem;
    z-index: 100;
  }
  .carousel .carousel-nav .nav-item {
    color: rgba(247, 248, 249, 0.5);
    display: block;
    -ms-flex: 1 0 auto;
    flex: 1 0 auto;
    height: 1.6rem;
    margin: 0.2rem;
    max-width: 2.5rem;
    position: relative;
  }
  .carousel .carousel-nav .nav-item::before {
    background: currentColor;
    content: "";
    display: block;
    height: 0.1rem;
    position: absolute;
    top: 0.5rem;
    width: 100%;
  }
  @keyframes carousel-slidein {
    0% {
      transform: translateX(100%);
    }
    100% {
      transform: translateX(0);
    }
  }
  @keyframes carousel-slideout {
    0% {
      opacity: 1;
      transform: translateX(0);
    }
    100% {
      opacity: 1;
      transform: translateX(-50%);
    }
  }

  .icon {
    box-sizing: border-box;
    display: inline-block;
    font-family: sans-serif;
    font-weight: 800;
    font-size: 20px;
    font-style: normal;
    height: 1em;
    position: relative;
    text-indent: -9999px;
    vertical-align: middle;
    width: 1em;
    cursor: pointer;
  }

  .icon::before,
  .icon::after {
    content: "";
    display: block;
    left: 50%;
    position: absolute;
    top: 50%;
    transform: translate(-50%, -50%);
  }

  .icon-arrow-left::before,
  .icon-arrow-right::before {
    border: 0.1rem solid currentColor;
    border-bottom: 0;
    border-right: 0;
    height: 0.65em;
    width: 0.65em;
  }

  .icon-arrow-left::before {
    transform: translate(-25%, -50%) rotate(-45deg);
  }

  .icon-arrow-right::before {
    transform: translate(-75%, -50%) rotate(135deg);
  }

  .btn.btn-lg {
    font-size: 0.9rem;
    height: 2rem;
    padding: 0.35rem 0.6rem;
  }
  .btn.btn-action.btn-lg {
    width: 2rem;
  }

  .text-hide {
    background: transparent;
    border: 0;
    color: transparent;
    font-size: 0;
    line-height: 0;
    text-shadow: none;
  }

  .c-hand {
    cursor: pointer;
  }
</style>

<div class="carousel" style={`height: ${height}; width: ${width};`}>
  {#each images as image, i (image.src)}
    <input
      type="radio"
      class="carousel-locator"
      name="carousel-radio"
      hidden="true"
      id={`slide-${i + 1}-carousel${index}`}
      checked={i === 0 ? 'true' : 'false'} />
  {/each}
  <div class="carousel-container">
    {#each images as { src, alt }, i (src)}
      <figure class="carousel-item">
        <label
          for={`slide-${i === 0 ? images.length : i}-carousel${index}`}
          class="item-prev btn btn-action btn-lg">
          <i class="icon icon-arrow-left" />
        </label>
        <label
          for={`slide-${i + 1 === images.length ? 1 : i + 2}-carousel${index}`}
          class="item-next btn btn-action btn-lg">
          <i class="icon icon-arrow-right" />
        </label>
        <img class="img-responsive rounded" {src} {alt} />
      </figure>
    {/each}
  </div>
  <div class="carousel-nav">
    {#each images as image, i (image.src)}
      <label
        for={`slide-${i + 1}-carousel${index}`}
        class="nav-item text-hide c-hand">
         {i + 1}
      </label>
    {/each}
  </div>
</div>
