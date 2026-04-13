<#import "template.ftl" as layout>
<@layout.mainLayout bodyClass="user-profile" active="account" title=msg("accountManagementTitle")>

<div id="app"></div>
<script>
    var keycloakAccountManagement = {
        authServerUrl: "${authUrl}",
        realm: "${realm.name}",
        clientId: "${clientId}"
    };
</script>

</@layout.mainLayout>
