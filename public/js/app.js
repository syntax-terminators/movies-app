$('#genre').on('change', triggerSubmit)
$('#year').on('change', triggerSubmit)

function triggerSubmit(){
    $('#filterForm').trigger('submit');
}