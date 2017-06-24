
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
    });
}

$(function(){

    save_timeout = null;
    draft_changes = 0;
    draft_saved_changes = 0;
    draft_saves_count = 0;

    var $status = $('.wiki-draft-status')
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

    function check_draft_status()
    {
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
        var draft = get_draft();
        var revision_id = $form.find('input[name=revision_id]').val();
        var params = {
            "revision_id": revision_id,
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
            check_draft_status();
        });
    }
})

