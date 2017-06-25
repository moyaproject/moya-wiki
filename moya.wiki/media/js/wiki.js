
wiki_rpc = null;
function get_rpc()
{
    if (wiki_rpc === null)
    {
        var rpc_url = $('input[name=wiki_rpc]').val();
        wiki_rpc = new JSONRPC(rpc_url);
    }
    return wiki_rpc;
}

function on_pick_post_images(collection_uuid, images, callback)
{
    var $content = $('textarea[name=content]');
    var params = {collection_uuid:collection_uuid,
                images:images};

    var rpc = get_rpc();
    rpc.call('render_images', params, function(result){
        $content.focus().blur();
        var textarea = $content[0];
        var value = textarea.value;
        var text_start = value.substring(0, textarea.selectionStart);
        var text_end = value.substring(textarea.selectionEnd, value.length);
        textarea.value = text_start + result.html + text_end;
        callback();
        $('a[href="#markup-tabs-markup"]').tab('show');
        on_draft_change();
    });

}

$(function(){

    save_timeout = null;
    draft_changes = 0;
    draft_saved_changes = 0;
    draft_saves_count = 0;

    var $form = $('form#wiki');
    $form.find('input,textarea').change(function(){
        on_draft_change();
    });
    $form.find('input,textarea').bind('input', function(){
        draft_changes += 1;
        check_draft_status();
        if(save_timeout)
        {
            clearTimeout(save_timeout);
        }
        save_timeout = setTimeout(on_draft_change, 1500);
    });
    $('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
        if($(e.target).attr('href')=='#markup-tabs-preview')
        {
            update_preview();
        }
    });
    update_preview();
});

function check_draft_status()
{
    var $status = $('.wiki-draft-status')
    if(draft_saves_count != 0)
    {
        $status.removeClass('saved');
        $status.removeClass('changed');
        $status.addClass('saving');
    }
    else
    {
        if(draft_changes == draft_saved_changes)
        {
            $status.removeClass('changed');
            $status.removeClass('saving');
            $status.addClass('saved');
        }
        else
        {
            $status.removeClass('saving');
            $status.removeClass('saved');
            $status.addClass('changed');
        }
    }
}

function on_draft_change()
{
    draft_saves_count += 1;
    check_draft_status();
    update_draft();
}

function get_draft()
{
    var $form = $('form#wiki');
    var draft = {
        "title": $form.find('input[name=title]').val(),
        "markup": $form.find('input:radio[name=markup]:checked').val(),
        "content": $form.find('textarea[name=content]').val(),
        "tagtext": $form.find('input[name=tagtext]').val()
    }
    return draft;

}

function update_draft()
{
    var $form = $('form#wiki');
    var draft = get_draft();
    var revision_id = $form.find('input[name=revision_id]').val();
    var params = {
        "revision_id": parseInt(revision_id),
        "draft": draft,
        "count": draft_changes
    }
    var rpc = get_rpc();
    rpc.call('save_draft', params, function(result){
        draft_saves_count -= 1;
        if(result.status=='success')
        {
            draft_saved_changes = result.count;
        }
        $('.moya-wiki-preview').html(result.html);
        check_draft_status();
    });
}

function update_preview()
{
    var $form = $('form#wiki');
    var revision_id = $form.find('input[name=revision_id]').val();
    var $preview = $('.moya-wiki-preview');
    var rpc = get_rpc();
    var params = {
        "revision_id": parseInt(revision_id),
    }
    rpc.call('preview_content', params, function(result){
        $preview.html(result.html);
    });
}

