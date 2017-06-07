import axios from 'axios';
import { $ } from './bling';

function ajaxHeart(event) {
    event.preventDefault();
    axios
        .post(this.action)
        .then(res => {
            const isHearted = this.heart.classList.toggle('heart__button--hearted');
            // this.heart is this forms child button with name="heart"
                // classList.toggle returns a boolean
            $('.heart-count').textContent = res.data.hearts.length;
            if(isHearted){
                this.heart.classList.add('heart__button--float');
                setTimeout(()=> {
                    this.heart.classList.remove('heart__button--float');
                }, 2500);
            }
        })
        .catch(err => {
            console.error(err)
        });

}

export default ajaxHeart;