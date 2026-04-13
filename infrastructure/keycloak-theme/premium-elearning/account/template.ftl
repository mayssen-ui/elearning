<#macro mainLayout active bodyClass title>
<!DOCTYPE html>
<html class="${properties.kcHtmlClass!}">
<head>
    <meta charset="utf-8">
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="robots" content="noindex, nofollow">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${title}</title>
    
    <!-- Premium E-Learning Theme Styles -->
    <link rel="stylesheet" href="${resourceUrl}/css/account.css">
    <link rel="stylesheet" href="${resourceUrl}/css/styles.css">
    
    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    
    <#if properties.styles?has_content>
        <#list properties.styles?split(" ") as style>
            <link href="${resourceUrl}/${style}" rel="stylesheet"/>
        </#list>
    </#if>
    
    <#if properties.scripts?has_content>
        <#list properties.scripts?split(" ") as script>
            <script src="${resourceUrl}/${script}" type="text/javascript"></script>
        </#list>
    </#if>
</head>
<body class="${bodyClass}">
    <div id="app">
        <#nested "content">
    </div>
    
    <!-- Theme JavaScript -->
    <script src="${resourceUrl}/js/account.js" type="text/javascript"></script>
</body>
</html>
</#macro>
