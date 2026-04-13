<#import "template.ftl" as layout>
<@layout.registrationLayout displayInfo=true displayMessage=!messagesPerField.existsError('firstName','lastName','email','username','password','password-confirm'); section>
    <#if section = "header">
        <span class="text-gradient">Register</span>
    <#elseif section = "form">
        <form id="kc-register-form" action="${url.registrationAction}" method="post">
            <div class="form-group">
                <label for="firstName" class="control-label">${msg("firstName")}</label>
                <input type="text" id="firstName" class="form-control" name="firstName" value="${(register.formData.firstName!'')}" placeholder="John" />
            </div>

            <div class="form-group">
                <label for="lastName" class="control-label">${msg("lastName")}</label>
                <input type="text" id="lastName" class="form-control" name="lastName" value="${(register.formData.lastName!'')}" placeholder="Doe" />
            </div>

            <div class="form-group">
                <label for="email" class="control-label">${msg("email")}</label>
                <input type="text" id="email" class="form-control" name="email" value="${(register.formData.email!'')}" autocomplete="email" placeholder="john.doe@example.com" />
            </div>

            <#if !realm.registrationEmailAsUsername>
                <div class="form-group">
                    <label for="username" class="control-label">${msg("username")}</label>
                    <input type="text" id="username" class="form-control" name="username" value="${(register.formData.username!'')}" autocomplete="username" placeholder="johndoe" />
                </div>
            </#if>

            <#if passwordRequired??>
                <div class="form-group">
                    <label for="password" class="control-label">${msg("password")}</label>
                    <input type="password" id="password" class="form-control" name="password" autocomplete="new-password" placeholder="••••••••" />
                </div>

                <div class="form-group">
                    <label for="password-confirm" class="control-label">${msg("passwordConfirm")}</label>
                    <input type="password" id="password-confirm" class="form-control" name="password-confirm" placeholder="••••••••" />
                </div>
            </#if>

            <div class="form-actions">
                <button class="btn-signin" type="submit">${msg("doRegister")}</button>
            </div>
        </form>
    <#elseif section = "info">
        <div class="registration-link">
            Already have an account? <a href="${url.loginUrl}">${kcSanitize(msg("backToLogin"))?no_esc}</a>
        </div>
    </#if>
</@layout.registrationLayout>
