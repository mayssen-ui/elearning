<#import "template.ftl" as layout>
<@layout.registrationLayout displayInfo=social.displayInfo displayMessage=!messagesPerField.existsError('username','password'); section>
    <#if section = "header">
        <span class="text-gradient">Sign in to your account</span>
    <#elseif section = "form">
        <form id="kc-form-login" onsubmit="login.disabled = true; return true;" action="${url.loginAction}" method="post">
            <div class="form-group">
                <label for="username" class="control-label">Username or email</label>
                <input tabindex="1" id="username" class="form-control" name="username" value="${(login.username!'')}" type="text" autofocus autocomplete="off" placeholder="user1" />
            </div>

            <div class="form-group">
                <label for="password" class="control-label">Password</label>
                <input tabindex="2" id="password" class="form-control" name="password" type="password" autocomplete="off" placeholder="••••••••" />
            </div>

            <div class="form-actions">
                <input type="hidden" id="id-token-hint" name="id_token_hint" value="${id_token_hint!}" />
                <button tabindex="4" class="btn-signin" name="login" id="kc-login" type="submit">Sign In</button>
            </div>
        </form>
    <#elseif section = "info">
        <#if realm.password && realm.registrationAllowed && !registrationDisabled??>
            <div class="registration-link">
                New user? <a tabindex="6" href="${url.registrationUrl}">Register</a>
            </div>
        </#if>
    </#if>
</@layout.registrationLayout>
