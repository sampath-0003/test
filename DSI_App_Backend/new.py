from pyspark.sql import SparkSession

spark = SparkSession.builder \
    .appName("Test") \
    .getOrCreate()

print("Spark initialized successfully!")
spark.stop()
