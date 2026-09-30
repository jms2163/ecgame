// Presentation only. Model transitions occur after the animation finishes.
// Cancelling navigation cancels all moving tokens without completing a reaction.
export class GuidedTransferAnimation {
    constructor() { this.animations=[];this.tokens=[];this.cancelled=false; }
    cancel() {
        this.cancelled=true;
        for(const a of this.animations)a.cancel();
        for(const token of this.tokens)token.remove();
    }
    async play(node,frames,duration) {
        if(this.cancelled || !node)return false;
        const animation=node.animate(frames,{duration:matchMedia('(prefers-reduced-motion: reduce)').matches?1:duration,easing:'ease-in-out',fill:'forwards'});
        this.animations.push(animation);
        try { await animation.finished;return !this.cancelled; } catch { return false; }
    }
    token(source) {
        const bounds=source.getBoundingClientRect(),token=source.cloneNode(true);
        token.classList.add('guided-transfer-token');
        Object.assign(token.style,{position:'fixed',left:`${bounds.left}px`,top:`${bounds.top}px`,width:`${bounds.width}px`,height:`${bounds.height}px`,margin:'0',pointerEvents:'none',zIndex:'1100'});
        document.body.append(token);this.tokens.push(token);return token;
    }
    async travel(token,target,duration=1100) {
        const from=token.getBoundingClientRect(),to=target.getBoundingClientRect();
        const x=to.left+to.width/2-from.left-from.width/2,y=to.top+to.height/2-from.top-from.height/2;
        return this.play(token,[{transform:'translate(0,0)',opacity:1},{transform:`translate(${x}px,${y}px)`,opacity:1}],duration);
    }
    async phosphorylate(container) {
        const carrier=container.querySelector('.guided-reaction-dock[data-input="ATP"] .guided-reduction-carrier');
        const target=container.querySelector('.guided-reaction-dock[data-input="PGA"] .guided-reaction-carbon');
        if(!carrier || !target)return false;
        if(!await this.play(carrier,[{transform:'translateX(-18px)'},{transform:'translateX(12px)'}],550))return false;
        const phosphate=carrier.querySelector('.is-atp-phosphate'),moving=this.token(phosphate);
        phosphate.style.visibility='hidden';
        if(!await this.travel(moving,target,1100))return false;
        const attached=phosphate.cloneNode(true);attached.style.visibility='visible';
        attached.classList.add('guided-attached-phosphate');target.parentElement.prepend(attached);this.tokens.push(attached);
        target.closest('.guided-reaction-molecule').querySelector('.guided-reaction-molecule-label').textContent='1,3-bisphosphoglycerate';
        moving.remove();carrier.querySelector('strong').textContent='ADP';
        await this.play(target,[{boxShadow:'0 0 0 0 #ffdc77'},{boxShadow:'0 0 12px 5px #ffdc77'},{boxShadow:'0 0 0 0 #ffdc77'}],350);
        return this.play(carrier,[{transform:'translateX(12px)',opacity:1},{transform:'translate(-75px,18px)',opacity:0}],650);
    }
    async reduce(container) {
        const carrier=container.querySelector('.guided-reaction-dock[data-input="NADPH"] .guided-reduction-carrier');
        const molecule=container.querySelector('.guided-reduction-bpg-target');
        const target=molecule?.querySelector('.guided-reaction-carbon');
        const source=carrier?.querySelector('.guided-hydride-bundle');
        if(!source || !target)return false;
        const hydride=this.token(source);source.style.visibility='hidden';
        if(!await this.travel(hydride,target,1500))return false;
        carrier.querySelector('strong').textContent='NADP⁺';
        carrier.querySelector('small').textContent='Hydride transferred';
        // The two electron dots move WITH the H⁻ token; no extra electrons follow.
        if(!await this.play(hydride,[{opacity:1},{opacity:0}],350))return false;
        if(!await this.play(target,[{boxShadow:'0 0 0 0 #b4e6ff'},{boxShadow:'0 0 14px 6px #b4e6ff'},{boxShadow:'0 0 0 0 #b4e6ff'}],450))return false;
        const phosphate=molecule.querySelector('.is-atp-phosphate'),pi=this.token(phosphate);phosphate.style.visibility='hidden';
        if(!await this.play(pi,[{transform:'translate(0,0)',opacity:1},{transform:'translate(20px,40px)',opacity:0}],650))return false;
        return !this.cancelled;
    }
    dispose() { for(const token of this.tokens)token.remove();for(const a of this.animations)a.cancel(); }
}
