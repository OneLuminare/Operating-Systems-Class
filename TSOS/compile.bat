dir *.ts /s /b > ts_file_list.txt
call tsc @ts_file_list.txt -rootDir source\ -outDir distrib\
del ts_file_list.txt