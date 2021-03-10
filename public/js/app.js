$('#genre').on('change', triggerGenreSubmit)
$('#year').on('change', triggerYearSubmit)

function triggerGenreSubmit(){
    $('#filterForm').trigger('submit');
    localStorage.setItem('genreVal', $(this).val())
}
function triggerYearSubmit(){
    $('#filterForm').trigger('submit');
    localStorage.setItem('yearVal', $(this).val())
}
$(document).ready(function() {
    if (localStorage.genreVal) {
        $('#genre').val( localStorage.genreVal);
    }
    if(localStorage.yearVal){
        $('#year').val(localStorage.yearVal)
    }
});
