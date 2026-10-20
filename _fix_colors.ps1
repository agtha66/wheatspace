$f = 'e:\personal\Vibecoding\Trae项目\WheatSpace2.0\other\index.html'
$c = [System.IO.File]::ReadAllText($f, [System.Text.Encoding]::UTF8)
$r = @(
    @('#4A1942','#745B72'), @('#7B3B72','#8A6888'), @('#3A1228','#3D2E3D'),
    @('#C9963A','#5C7995'), @('#C8102E','#D49DAA'), @('#D4213D','#D49DAA'),
    @('#7EC8A4','#AAABB9'), @('#4A9B7F','#8A9BB5'), @('#E8C97A','#E6BCBC'),
    @('#EDAEBB','#E6BCBC'), @('#FBF0E6','#FAF3F3'), @('#F0E8D6','#EAE8F0'),
    @('#F5E0E8','#F0E8F0'), @('#F7E8E8','#F5EEEE'), @('#9A7B84','#9B8FA0'),
    @('#B8862C','#7A90AA'),
    @('rgba(74,25,66,','rgba(116,91,114,'),
    @('rgba(201,150,58,','rgba(92,121,149,'),
    @('rgba(126,200,164,','rgba(170,171,185,'),
    @('rgba(58,18,40,','rgba(61,46,61,'),
    @('rgba(237,174,187,','rgba(230,188,188,')
)
foreach ($p in $r) { $c = $c.Replace($p[0], $p[1]) }
[System.IO.File]::WriteAllText($f, $c, [System.Text.Encoding]::UTF8)
Write-Host "Done"
