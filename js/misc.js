function ready() {
        let domInNumber = document.querySelector('.js-in-number');
    
        domInNumber.addEventListener('input', function (e) {
            let current = e.currentTarget;
            let val = current.value.replace(/[^0-9\.]/g, '');
            
    
            if (+val <=40) {
                current.value = val;
            } else {
                current.value = val.slice(0, -1); 
            }
            
            var mintTotal = current.value * 50;
            var totalHTML = 'TOTAL: '+mintTotal+' $CRO';
            document.getElementById("mintTotalCost").innerHTML = totalHTML;
        });
    
        $("#refreshSupply").load(location.href + " #refreshSupply");
    
    }
    
document / addEventListener("DOMContentLoaded", ready) 